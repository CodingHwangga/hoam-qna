export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import AnswerForm from "./AnswerForm";
import CaseStageSelect from "./CaseStageSelect";

type Question = {
  id: number;
  title: string;
  body: string;
  case_stage: string; // ✅ 추가
  created_at: string;
};

type Answer = {
  id: number;
  question_id: number;
  body: string;
  is_ai_draft: boolean;
  created_at: string;
};

export default async function QuestionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const qid = Number(id);

  if (!Number.isFinite(qid)) {
    return (
      <main style={{ padding: 24 }}>
        <p>잘못된 질문 ID입니다. (받은 값: {String(id)})</p>
        <p>
          <Link href="/questions">← 목록</Link>
        </p>
      </main>
    );
  }

  const qRes = await supabase
    .from("questions")
    .select("id,title,body,case_stage,created_at") // ✅ case_stage 추가
    .eq("id", qid)
    .maybeSingle();

  if (qRes.error) {
    return (
      <main style={{ padding: 24 }}>
        <h1>질문 상세</h1>
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {JSON.stringify(qRes.error, null, 2)}
        </pre>
        <p style={{ marginTop: 12 }}>
          <Link href="/questions">← 목록</Link>
        </p>
      </main>
    );
  }

  if (!qRes.data) {
    return (
      <main style={{ padding: 24 }}>
        <h1>질문을 찾을 수 없습니다.</h1>
        <p style={{ marginTop: 12 }}>
          <Link href="/questions">← 목록</Link>
        </p>
      </main>
    );
  }

  const q = qRes.data as Question;

  const aRes = await supabase
    .from("answers")
    .select("id,question_id,body,is_ai_draft,created_at")
    .eq("question_id", qid)
    .order("created_at", { ascending: true });

  const answers = (aRes.data ?? []) as Answer[];

  return (
    <main style={{ padding: 24, maxWidth: 840, margin: "0 auto" }}>
      <p>
        <Link href="/questions">← 목록</Link>
      </p>

      <h1 style={{ marginTop: 12, fontSize: 24, fontWeight: 700 }}>{q.title}</h1>
      <p style={{ marginTop: 8, opacity: 0.7 }}>
        #{q.id} · {new Date(q.created_at).toLocaleString()}
      </p>

      {/* ✅ 사건 단계 표시 + 변경 */}
      <CaseStageSelect questionId={q.id} initialStage={q.case_stage ?? "intake"} />

      <div
        style={{
          marginTop: 16,
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 12,
          whiteSpace: "pre-wrap",
        }}
      >
        {q.body}
      </div>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>답변</h2>

        {!aRes.error && answers.length === 0 && (
          <p style={{ marginTop: 10, opacity: 0.7 }}>아직 답변이 없습니다.</p>
        )}

        {aRes.error && (
          <pre style={{ marginTop: 10, whiteSpace: "pre-wrap", color: "crimson" }}>
            {JSON.stringify(aRes.error, null, 2)}
          </pre>
        )}

        {!aRes.error && answers.length > 0 && (
          <ul style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {answers.map((a) => (
              <li key={a.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
                <div style={{ opacity: 0.7, fontSize: 12 }}>
                  #{a.id} · {new Date(a.created_at).toLocaleString()}
                  {a.is_ai_draft ? " · AI 초안" : ""}
                </div>
                <div style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{a.body}</div>
              </li>
            ))}
          </ul>
        )}

        <AnswerForm questionId={qid} questionTitle={q.title} questionBody={q.body} />
      </section>
    </main>
  );
}
