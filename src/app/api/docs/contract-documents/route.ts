import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const contractId = Number(searchParams.get("contractId"));

  if (!Number.isFinite(contractId)) {
    return NextResponse.json({ error: "contractId required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("contract_documents")
    .select("id,contract_id,doc_type,title,content,created_at,meta")
    .eq("contract_id", contractId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const meta = (body?.meta ?? null) as any;

  const contractId = Number(body?.contractId);
  const docType = String(body?.docType ?? "");
  const title = String(body?.title ?? "");
  const content = String(body?.content ?? "");

  if (!Number.isFinite(contractId)) {
    return NextResponse.json({ error: "contractId required" }, { status: 400 });
  }
  if (!docType) return NextResponse.json({ error: "docType required" }, { status: 400 });
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
  if (!content) return NextResponse.json({ error: "content required" }, { status: 400 });

  const { data, error } = await supabase
    .from("contract_documents")
    .insert({
      contract_id: contractId,
      doc_type: docType,
      title,
      content,
      meta,
    })
    .select("id,contract_id,doc_type,title,content,created_at")
    .single();

  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}
