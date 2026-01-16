import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import ContractDetailClient from "./ContractDetailClient";
import ContentProofClient from "./ContentProofClient";


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
        <p>잘못된 계약 ID입니다: {String(id)}</p>
        <p>
          <Link href="/contracts">계약 목록</Link>
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
        <h1>계약 상세</h1>
        <pre style={{ whiteSpace: "pre-wrap", color: "crimson" }}>
          {JSON.stringify(error, null, 2)}
        </pre>
        <p style={{ marginTop: 12 }}>
          <Link href="/contracts">계약 목록</Link>
        </p>
      </main>
    );
  }

  if (!data) {
    return (
      <main style={{ padding: 24 }}>
        <h1>계약을 찾을 수 없습니다.</h1>
        <p style={{ marginTop: 12 }}>
          <Link href="/contracts">계약 목록</Link>
        </p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 840, margin: "0 auto" }}>
      <p>
        <Link href="/contracts">계약 목록</Link>
      </p>

      <h1 style={{ marginTop: 12 }}>{data.title}</h1>
      <p style={{ opacity: 0.7 }}>
        #{data.id} · 상태: <b>{data.status}</b>
      </p>

      <div
  style={{
    marginTop: 16,
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: 12,
    lineHeight: 1.7,
  }}
>
  <h2 style={{ marginTop: 0 }}>계약 정보</h2>

  <div>주소: {data.address ?? "-"}</div>
  <div>임대인: {data.landlord_name ?? "-"}</div>
  <div>임차인: {data.tenant_name ?? "-"}</div>

  <hr style={{ margin: "12px 0" }} />

  <div>계약 시작일: {data.lease_start ?? "-"}</div>
  <div>계약 종료일: {data.lease_end ?? "-"}</div>

  <hr style={{ margin: "12px 0" }} />

  <div>보증금: {data.deposit ?? "-"}</div>
  <div>월세: {data.rent ?? "-"}</div>
  <div>월세 납부일(payday): {data.payday ?? "-"}</div>

  <hr style={{ margin: "12px 0" }} />

  <div>
    특약:
    <pre style={{ whiteSpace: "pre-wrap", margin: "6px 0 0" }}>
      {data.special_terms ?? "-"}
    </pre>
  </div>
</div>


      {/* 상태 변경 UI */}
      <ContractDetailClient contract={data} />
      <ContentProofClient contractId={data.id} />


      <section style={{ marginTop: 24 }}>
        <h2>다음 액션(초안)</h2>
        {data.status === "overdue" ? (
          <ul>
            <li>내용증명 발송 (추천)</li>
            <li>문자/카톡 발송</li>
            <li>대기 (비추천)</li>
          </ul>
        ) : (
          <p style={{ opacity: 0.7 }}>
            연체(overdue) 상태로 변경 시 액션 플랜이 표시됩니다.
          </p>
        )}
      </section>
    </main>
  );
}
