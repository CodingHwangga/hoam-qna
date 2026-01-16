import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysBetween(aYMD: string, bYMD: string) {
  const [ay, am, ad] = aYMD.split("-").map(Number);
  const [by, bm, bd] = bYMD.split("-").map(Number);
  const a = Date.UTC(ay, am - 1, ad);
  const b = Date.UTC(by, bm - 1, bd);
  return Math.max(0, Math.floor((b - a) / (24 * 60 * 60 * 1000)));
}

function dueYMDForThisMonth(today: Date, payday: number) {
  const y = today.getFullYear();
  const m = today.getMonth();
  const last = new Date(y, m + 1, 0).getDate();
  const day = Math.min(payday, last);
  return toYMD(new Date(y, m, day));
}

export async function POST() {
  const today = new Date();
  const todayYMD = toYMD(today);

  // terminated 제외 + payday 있는 것만
  const { data, error } = await supabase
    .from("contracts")
    .select("id,status,payday")
    .neq("status", "terminated")
    .not("payday", "is", null);

  if (error) return NextResponse.json({ error }, { status: 500 });

  let updated = 0;

  for (const c of data ?? []) {
    const payday = Number((c as any).payday);
    if (!Number.isFinite(payday) || payday < 1 || payday > 31) continue;

    const dueThisMonth = dueYMDForThisMonth(today, payday);
    const overdueDays = todayYMD > dueThisMonth ? daysBetween(dueThisMonth, todayYMD) : 0;

    let nextStatus = (c as any).status;
    if (overdueDays > 0) nextStatus = "overdue";
    if (overdueDays === 0 && (c as any).status === "overdue") nextStatus = "active";

    if (nextStatus !== (c as any).status) {
      const { error: uerr } = await supabase
        .from("contracts")
        .update({ status: nextStatus, overdue_days: overdueDays })
        .eq("id", (c as any).id);

      if (!uerr) updated += 1;
    } else {
      // status 그대로여도 overdue_days는 갱신
      await supabase
        .from("contracts")
        .update({ overdue_days: overdueDays })
        .eq("id", (c as any).id);
    }
  }

  return NextResponse.json({ ok: true, todayYMD, updated });
}
