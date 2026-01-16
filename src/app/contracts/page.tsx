import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import ContractsSyncClient from "./ContractsSyncClient";
import ContractsOverdueSyncClient from "./ContractsOverdueSyncClient";


export const dynamic = "force-dynamic";

export default async function ContractsPage() {
  const { data, error } = await supabase
    .from("contracts")
    .select("id,title,status,created_at,lease_end")
    .order("created_at", { ascending: false });

  return (
    <>
      <ContractsSyncClient />
      <ContractsOverdueSyncClient />


      <main style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
        <h1>계약서 목록</h1>

        <p style={{ marginTop: 12 }}>
          <Link href="/contracts/new">+ 계약서 추가</Link>
        </p>

        {error && (
          <pre style={{ whiteSpace: "pre-wrap", color: "crimson" }}>
            {JSON.stringify(error, null, 2)}
          </pre>
        )}

        <ul style={{ marginTop: 20, paddingLeft: 18 }}>
          {(data ?? []).map((c: any) => (
            <li key={c.id} style={{ marginBottom: 10 }}>
              <Link href={`/contracts/${c.id}`}>
                {c.title ?? "(제목 없음)"} ({c.status ?? "active"})
              </Link>

              {c.lease_end && (
                <span style={{ marginLeft: 8, opacity: 0.6 }}>
                  종료일: {c.lease_end}
                </span>
              )}
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
