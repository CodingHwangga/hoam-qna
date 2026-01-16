import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export default async function ContractsPage() {
  const { data, error } = await supabase
    .from("contracts")
    .select("*")
    .order("created_at", { ascending: false });

  return (
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

      <ul style={{ marginTop: 20 }}>
        {(data ?? []).map((c: any) => (
          <li key={c.id} style={{ marginBottom: 10 }}>
            <Link href={`/contracts/${c.id}`}>
              {c.title} ({c.status})
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
