import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseYMD(s: string) {
  // s: "YYYY-MM-DD"
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function daysBetween(a: Date, b: Date) {
  const ms = 24 * 60 * 60 * 1000;
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((ub - ua) / ms);
}

function calcNextDueDate(today: Date, payday: number) {
  // payday: 1~31
  const y = today.getFullYear();
  const m = today.getMonth();

  const thisMonthLast = new Date(y, m + 1, 0).getDate();
  const dueDayThisMonth = Math.min(payday, thisMonthLast);
  const dueThisMonth = new Date(y, m, dueDayThisMonth);

  if (today <= dueThisMonth) return dueThisMonth;

  const nextMonthLast = new Date(y, m + 2, 0).getDate();
  const dueDayNextMonth = Math.min(payday, nextMonthLast);
  return new Date(y, m + 1, dueDayNextMonth);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const contractId = body?.contractId as number | undefined;

  if (!contractId || !Number.isFinite(contractId)) {
    return NextResponse.json({ error: "contractId required" }, { status: 400 });
  }

  const { data: c, error } = await supabase
    .from("contracts")
    .select("id,status,payday")
    .eq("id", contractId)
    .maybeSingle();

  if (error) return NextResponse.json({ error }, { status: 500 });
  if (!c) return NextResponse.json({ error: "not found" }, { status: 404 });

  const today = new Date();
  const payday = Number(c.payday);

  if (!Number.isFinite(payday) || payday < 1 || payday > 31) {
    return NextResponse.json({ error: "invalid payday" }, { status: 400 });
  }

  const nextDue = calcNextDueDate(today, payday);
  const nextDueYMD = toYMD(nextDue);

  // 연체 판단: "이번 달 납부일"이 지났고, 상태가 active면 overdue로 전환
  const thisMonthLast = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const dueDayThisMonth = Math.min(payday, thisMonthLast);
  const dueThisMonth = new Date(today.getFullYear(), today.getMonth(), dueDayThisMonth);

  const overdueDays =
    today > dueThisMonth ? Math.max(0, daysBetween(dueThisMonth, today)) : 0;

  const nextStatus =
    overdueDays > 0 && c.status !== "terminated" ? "overdue" : c.status === "overdue" && overdueDays === 0 ? "active" : c.status;

  const { data: updated, error: uerr } = await supabase
    .from("contracts")
    .update({
      next_due_date: nextDueYMD,
      overdue_days: overdueDays,
      status: nextStatus,
    })
    .eq("id", contractId)
    .select("id,status,next_due_date,overdue_days")
    .single();

  if (uerr) return NextResponse.json({ error: uerr }, { status: 500 });

  return NextResponse.json({ ok: true, updated });
}
