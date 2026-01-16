import OpenAI from "openai";

export const runtime = "nodejs";

type ReqBody = {
  context: {
    title: string;
    body: string;
    // 선택 필드(있으면 더 좋지만, 프로토타입이라 없어도 됨)
    landlordName?: string;
    tenantName?: string;
    address?: string;
    contractEndDate?: string; // YYYY-MM-DD
  };
};

function bad(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-5-chat-latest";

  if (!apiKey) return bad("OPENAI_API_KEY가 설정되지 않았습니다.", 500);

  let payload: ReqBody;
  try {
    payload = (await req.json()) as ReqBody;
  } catch {
    return bad("JSON body가 올바르지 않습니다.");
  }

  const title = payload?.context?.title?.trim();
  const body = payload?.context?.body?.trim();
  if (!title || !body) return bad("context.title / context.body가 필요합니다.");

  const openai = new OpenAI({ apiKey });

  // ✅ ‘실무 문서 초안’ 톤: 단정/과장 금지, 빈칸 남기기, 상대방 자극 최소화
  const system = `
너는 법무 실무자가 고객을 도와 '내용증명(통지서) 초안'을 작성하는 역할이다.
아래 규칙을 반드시 지킨다.

규칙:
- 결과물은 '초안'이며, 사실관계/기한/금액/당사자 특정은 빈칸(____)으로 남겨라(확실하지 않으면).
- 상대방을 과도하게 자극하거나 협박하는 표현은 쓰지 않는다.
- 법조문 번호를 임의로 적지 않는다.
- 분량은 A4 1장 내외로 간결하게.
- 문서 형식은 아래 순서를 지킨다.

형식(한국어):
1) 제목: 내용증명(통지서)
2) 수신 / 발신 / 주소(빈칸 허용)
3) 본문: 사실관계 요약(3~6문장)
4) 요구사항: 인도(퇴거)/이행/정산 등 2~4항목
5) 기한: ____까지 이행 요청
6) 불이행 시 조치: '필요 시 법적 절차를 검토' 수준(구체적 위협 금지)
7) 첨부: 계약서/통지서/정산내역 등 예시
8) 작성일 / 발신인 서명란

이제 제공된 질문 내용을 바탕으로 위 형식의 '내용증명 초안'을 작성하라.
`.trim();

  const user = `
[상황(질문 제목)]
${title}

[상황(질문 내용)]
${body}

가능하면 아래 정보를 문서에 반영하되, 확실하지 않으면 빈칸(____) 처리:
- 발신인(임대인): ${payload.context.landlordName ?? "____"}
- 수신인(임차인): ${payload.context.tenantName ?? "____"}
- 목적물 주소: ${payload.context.address ?? "____"}
- 계약 종료일(또는 종료 예정일): ${payload.context.contractEndDate ?? "____"}
`.trim();

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.2,
    });

    const draft = completion.choices?.[0]?.message?.content?.trim() || "";
    if (!draft) return Response.json({ error: "초안 생성 결과가 비어 있습니다." }, { status: 502 });

    return Response.json({ draft });
  } catch (e: any) {
    return Response.json(
      { error: `OpenAI 호출 실패: ${e?.message ?? String(e)}` },
      { status: 502 }
    );
  }
}
