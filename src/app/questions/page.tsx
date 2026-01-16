export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Question = {
  id: number;
  title: string;
  body: string;
  created_at: string;
};

export default async function QuestionsPage() {
  const { data, error } = await supabase
    .from("questions")
    .select("id,title,body,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  console.log("[questions] error:", error);
  console.log("[questions] count:", data?.length ?? 0);
  console.log("[questions] first:", data?.[0]?.title);

  if (error) {
    return (
      <main style={{ padding: 24 }}>
        <h1>질문 목록</h1>
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {JSON.stringify(error, null, 2)}
        </pre>
        <p style={{ marginTop: 12 }}>
          <Link href="/questions/new">+ 질문 작성</Link>
        </p>
      </main>
    );
  }

  const questions = (data ?? []) as Question[];

  return (
    <main style={{ padding: 24, maxWidth: 840, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>질문 목록</h1>

      <p style={{ marginTop: 10 }}>
        <Link href="/questions/new">+ 질문 작성</Link>
      </p>

      <p style={{ marginTop: 10, opacity: 0.7 }}>
        DEBUG: count = {questions.length}
      </p>

      <ul style={{ marginTop: 16, display: "grid", gap: 8 }}>
        {questions.map((q) => (
          <li
            key={q.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "baseline",
              }}
            >
              <div>
                <b>#{q.id}</b> {q.title}
              </div>
              <Link href={`/questions/${q.id}`}>상세</Link>
            </div>

            <div style={{ marginTop: 6, opacity: 0.8 }}>
              {q.body.length > 80 ? q.body.slice(0, 80) + "…" : q.body}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
