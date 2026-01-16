"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function NewQuestionPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const submit = async () => {
    try {
      // 클릭 확인
      alert("submit clicked");

      setErrorMsg(null);

      const t = title.trim();
      const b = body.trim();

      if (!t || !b) {
        setErrorMsg("제목과 내용을 모두 입력해 주세요.");
        return;
      }

      setLoading(true);

      const res = await supabase
        .from("questions")
        .insert({ title: t, body: b })
        .select();

      setLoading(false);

      if (res.error) {
        setErrorMsg(`INSERT ERROR: ${res.error.message}`);
        return;
      }

      alert("insert success");

      router.push("/questions");
      router.refresh();
    } catch (e: any) {
      setLoading(false);
      setErrorMsg(`EXCEPTION: ${e?.message ?? String(e)}`);
    }
  };

  return (
    <main style={{ padding: 24, maxWidth: 840, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>질문 작성</h1>

      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>제목</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 명도소송 진행 중 임차인이 안 나갈 때"
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>내용</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="상황을 구체적으로 적어주세요"
            rows={10}
            style={{ padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
          />
        </label>

        {errorMsg && (
          <pre style={{ whiteSpace: "pre-wrap", color: "crimson" }}>
            {errorMsg}
          </pre>
        )}

        <button
          onClick={submit}
          disabled={loading}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #111",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "등록 중..." : "질문 등록"}
        </button>
      </div>
    </main>
  );
}
