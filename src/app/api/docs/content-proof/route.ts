import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function monthsBetweenYM(start: string, end: string) {
  // "YYYY.MM"
  const [sy, sm] = start.split(".").map(Number);
  const [ey, em] = end.split(".").map(Number);
  if (!sy || !sm || !ey || !em) return null;
  return ey * 12 + em - (sy * 12 + sm) + 1;
}

function calcOverdueDays(today: Date, payday: number) {
  const y = today.getFullYear();
  const m = today.getMonth();
  const last = new Date(y, m + 1, 0).getDate();
  const dueDay = Math.min(payday, last);
  const due = new Date(y, m, dueDay);
  if (today <= due) return 0;
  return Math.floor(
    (Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) -
      Date.UTC(due.getFullYear(), due.getMonth(), due.getDate())) /
    (24 * 60 * 60 * 1000)
  );
}

function dueYMDThisMonth(today: Date, payday: number) {
  const y = today.getFullYear();
  const m = today.getMonth();
  const last = new Date(y, m + 1, 0).getDate();
  const d = Math.min(payday, last);
  const mm = String(m + 1).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const contractId = body?.contractId as number | undefined;
  const purpose = String(body?.purpose ?? "rent_overdue");
  const inputs = (body?.inputs ?? {}) as Record<string, any>;

  if (!contractId || !Number.isFinite(contractId)) {
    return NextResponse.json({ error: "contractId required" }, { status: 400 });
  }

  const allowed = ["rent_overdue", "termination_notice", "moveout_restore"];
  if (!allowed.includes(purpose)) {
    return NextResponse.json({ error: "invalid purpose" }, { status: 400 });
  }

  const { data: c, error } = await supabase
    .from("contracts")
    .select(
      "id,title,address,landlord_name,tenant_name,lease_start,lease_end,deposit,rent,payday,status,special_terms,overdue_days"
    )
    .eq("id", contractId)
    .maybeSingle();

  if (error) return NextResponse.json({ error }, { status: 500 });
  if (!c) return NextResponse.json({ error: "not found" }, { status: 404 });

  const today = new Date();
  const payday = Number(c.payday);

  const overdueDays =
    Number.isFinite(payday) && payday >= 1 && payday <= 31
      ? calcOverdueDays(today, payday)
      : 0;

  let unpaidMonthsText = "____";
  if (inputs.unpaid_period) {
    const parts = String(inputs.unpaid_period).split("~").map((s) => s.trim());
    if (parts.length === 2) {
      const cnt = monthsBetweenYM(parts[0], parts[1]);
      if (cnt && cnt > 0) unpaidMonthsText = `${cnt}개월 (${parts[0]} ~ ${parts[1]})`;
    }
  }

  const dueYMD =
    Number.isFinite(payday) && payday >= 1 && payday <= 31
      ? dueYMDThisMonth(today, payday)
      : "____-__-__";

  const purposeLabel =
    purpose === "rent_overdue"
      ? "월세 연체 독촉"
      : purpose === "termination_notice"
        ? "계약 해지/종료 통보"
        : "퇴거 요청 및 원상복구 요청";

  const extraFacts =
    purpose === "rent_overdue"
      ? `- 미납 기간: ${inputs.unpaid_period ?? "____"}
- 미납 개월 수: ${unpaidMonthsText}
- 미납 금액(추정): ${inputs.unpaid_amount ?? "____"}
- 최근 납부기한 기준 연체일수: ${overdueDays}일`
      : purpose === "termination_notice"
        ? `- 종료/해지 사유: ${inputs.termination_reason ?? "____"}
- 종료/해지 기준일: ${inputs.termination_date ?? (c.lease_end ?? "____")}`
        : `- 퇴거 요청 사유: ${inputs.moveout_reason ?? "____"}
- 퇴거 요청 기한: ${inputs.moveout_deadline ?? "____"}
- 원상복구 요청 범위: ${inputs.restore_scope ?? "____"}`;

  const computedFacts =
    purpose === "rent_overdue"
      ? `- (확정) 미납 개월 수: ${unpaidMonthsText}
- (확정) 최근 납부기한(이번 달): ${dueYMD}
- (확정) 최근 납부기한 기준 연체일수: ${overdueDays}일
- (입력) 미납 기간: ${inputs.unpaid_period ?? "____"}
- (입력) 미납 금액(추정): ${inputs.unpaid_amount ?? "____"}`
      : extraFacts;

  const system = `
너는 임대인 대상 부동산 문서 초안 생성기다.
법적 판단/효력 판단/최종 문구 확정은 하지 않는다.
'내용증명 초안'만 작성한다.
사실은 입력값 기반으로만 작성. 모르는 값은 ____ 로 둔다.
연체 개월 수와 연체 일수는 다른 개념이므로,
본문에는 '총 ○개월 미납'을 핵심으로 쓰고,
연체일수는 '최근 납부기한 기준 ○일 경과'로 보조 설명한다.
구체적 법적 조치의 단정적 표현은 사용하지 않는다.
[규칙] "(확정)"으로 표시된 값은 절대 ____로 바꾸지 말고 그대로 본문에 반영한다.
[규칙] rent_overdue 유형은 사실관계 문단에 (확정) 값 3개를 반드시 포함한다.
반드시 마지막에 면책 문구를 포함한다.
형식: 제목, 발신/수신, 임대차 기본정보, 사실관계, 요구사항, 기한, 미이행 시 예정 조치(일반적 수준), 날짜, 서명.
`.trim();

  const user = `
[문서 목적]
- 유형: ${purpose} (${purposeLabel})

[계약 데이터]
- 계약ID: ${c.id}
- 제목: ${c.title ?? ""}
- 주소: ${c.address ?? ""}
- 임대인: ${c.landlord_name ?? ""}
- 임차인: ${c.tenant_name ?? ""}
- 시작일: ${c.lease_start ?? ""}
- 종료일: ${c.lease_end ?? ""}
- 보증금: ${c.deposit ?? ""}
- 월세: ${c.rent ?? ""}
- 납부일: 매월 ${c.payday ?? ""}일
- 현재 상태: ${c.status ?? ""}
- 특약: ${c.special_terms ?? ""}

[추가 사실]
${computedFacts}

요청:
위 정보를 바탕으로 '${purposeLabel}' 목적의 내용증명 초안을 한국어로 작성해줘.
필요하지만 데이터가 없는 항목은 ____ 로 남겨서 사용자가 채울 수 있게 해줘.
`.trim();

  try {
    const model = process.env.OPENAI_MODEL || "gpt-5-chat-latest";

    const resp = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.2,
    });

    const draft = resp.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({
      ok: true,
      draft,
      debug: {
        purpose,
        inputs,
        unpaidMonthsText,
        dueYMD,
        overdueDays,
        computedFacts,
      },
    });

  } catch (e) {
    const msg = (e as any)?.message ?? "openai error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
