import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function POST() {
  const todayYMD = toYMD(new Date());

  // 1) 계약기간 만료 -> terminated
  // lease_end가 오늘보다 과거인 계약 중, 아직 terminated 아닌 것만 대상
  const { data: expired, error: selErr } = await supabase
    .from("contracts")
    .select("id,status,lease_end")
    .not("lease_end", "is", null)
    .lt("lease_end", todayYMD)
    .neq("status", "terminated");

  if (selErr) return NextResponse.json({ error: selErr }, { status: 500 });

  const ids = (expired ?? []).map((x: any) => x.id);

  let updatedCount = 0;

  if (ids.length > 0) {
    const { error: updErr } = await supabase
      .from("contracts")
      .update({ status: "terminated" })
      .in("id", ids);

    if (updErr) return NextResponse.json({ error: updErr }, { status: 500 });
    updatedCount = ids.length;
  }

  return NextResponse.json({ ok: true, updatedCount, todayYMD });
}
