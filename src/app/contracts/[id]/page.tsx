import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cid = Number(id);

  if (!Number.isFinite(cid)) {
    return (
      <main style={{ padding: 24 }}>
        <p>잘못된 계약서 ID입니다: {String(id)}</p>
        <p>
          <Link href="/contracts">← 목록</Link>
        </p>
      </main>
    );
  }

  const { data, error } = await supabase
    .from("contracts")
    .select("*")
    .eq("id", cid)
    .maybeSingle();

  if (error) {
    return (
      <main style={{ padding: 24 }}>
        <h1>계약서 상세</h1>
        <pre style={{ whiteSpace: "pre-wrap", color: "crimson" }}>
          {JSON.stringify(error, null, 2)}
        </pre>
        <p style={{ marginTop: 12 }}>
          <Link href="/contracts">← 목록</Link>
        </p>
      </main>
    );
  }

  if (!data) {
    return (
      <main style={{ padding: 24 }}>
        <h1>계약서를 찾을 수 없습니다.</h1>
        <p style={{ marginTop: 12 }}>
          <Link href="/contracts">← 목록</Link>
        </p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 840, margin: "0 auto" }}>
      <p>
        <Link href="/contracts">← 목록</Link>
      </p>

      <h1 style={{ marginTop: 12 }}>{data.title}</h1>
      <p style={{ opacity: 0.7 }}>
        #{data.id} · 상태: <b>{data.status}</b>
      </p>

      <div style={{ marginTop: 16, border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
        <div>주소: {data.address ?? "-"}</div>
        <div>임대인: {data.landlord_name ?? "-"}</div>
        <div>임차인: {data.tenant_name ?? "-"}</div>
      </div>

      <section style={{ marginTop: 24 }}>
        <h2>다음 액션(초안)</h2>
        {data.status === "overdue" ? (
          <ul>
            <li>① 내용증명 발송 (추천)</li>
            <li>② 문자/카톡 발송</li>
            <li>③ 대기 (비추천)</li>
          </ul>
        ) : (
          <p style={{ opacity: 0.7 }}>연체(overdue) 상태로 바꾸면 액션 플랜이 뜹니다.</p>
        )}
      </section>
    </main>
  );
}
