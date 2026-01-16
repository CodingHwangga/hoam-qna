"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";



export default function AnswerForm({
  questionId,
  questionTitle,
  questionBody,
}: {
  questionId: number;
  questionTitle: string;
  questionBody: string;
}) {
  const router = useRouter();

  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [noticeLoading, setNoticeLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ✅ Action CTA 결과(내용증명 초안)
  const [noticeDraft, setNoticeDraft] = useState("");

  const generateAIDraft = async () => {
    setErrorMsg(null);
    setAiLoading(true);

    try {
      const res = await fetch("/api/ai/answer-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: { id: questionId, title: questionTitle, body: questionBody },
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json?.error ?? "AI 초안 생성 실패");
        setAiLoading(false);
        return;
      }

      setBody(json.draft ?? "");
      setAiLoading(false);
    } catch (e: any) {
      setAiLoading(false);
      setErrorMsg(`AI 호출 예외: ${e?.message ?? String(e)}`);
    }
  };

  const generateNoticeDraft = async () => {
    setErrorMsg(null);
    setNoticeLoading(true);

    try {
      const res = await fetch("/api/ai/notice-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: {
            title: questionTitle,
            body: questionBody,
            // 프로토타입: 당사자/주소/기한은 빈칸으로 두고 생성 (추후 폼으로 받을 수 있음)
          },
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json?.error ?? "내용증명 초안 생성 실패");
        setNoticeLoading(false);
        return;
      }

      setNoticeDraft(json.draft ?? "");
      setNoticeLoading(false);
    } catch (e: any) {
      setNoticeLoading(false);
      setErrorMsg(`내용증명 호출 예외: ${e?.message ?? String(e)}`);
    }
  };

  const submit = async () => {
    setErrorMsg(null);

    const b = body.trim();
    if (!b) {
      setErrorMsg("답변 내용을 입력해 주세요.");
      return;
    }

    setLoading(true);

    const res = await supabase
      .from("answers")
      .insert({ question_id: questionId, body: b, is_ai_draft: false })
      .select();

    setLoading(false);

    if (res.error) {
      setErrorMsg(`INSERT ERROR: ${res.error.message}`);
      return;
    }

    setBody("");
    router.refresh();
  };

  return (
    <section style={{ marginTop: 16, border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700 }}>답변 작성</h3>

      <p style={{ marginTop: 8, opacity: 0.75, fontSize: 12, lineHeight: 1.5 }}>
        ※ “AI 초안/문서 초안”은 법률자문이 아닌 일반 정보 및 작성 보조를 위한 초안입니다.
        실제 발송/제출 전에는 반드시 사실관계 확인 및 담당자 검토가 필요합니다.
      </p>

      <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={generateAIDraft}
            disabled={aiLoading}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #111",
              cursor: aiLoading ? "not-allowed" : "pointer",
            }}
          >
            {aiLoading ? "AI 초안 생성 중..." : "AI 답변 초안 생성"}
          </button>

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
            {loading ? "등록 중..." : "답변 등록"}
          </button>
        </div>

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          placeholder="답변을 입력하거나, AI 초안 생성으로 시작하세요..."
          style={{ padding: 10, border: "1px solid #ddd", borderRadius: 8 }}
        />

        {/* ✅ Action CTA 섹션 */}
        <div style={{ marginTop: 8, borderTop: "1px solid #eee", paddingTop: 12 }}>
          <h4 style={{ fontSize: 14, fontWeight: 700 }}>다음 행동</h4>
          <p style={{ marginTop: 6, opacity: 0.75, fontSize: 12 }}>
            고객님이 바로 실행할 수 있는 문서/절차를 초안으로 만들어줍니다.
          </p>

          <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={generateNoticeDraft}
              disabled={noticeLoading}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #111",
                cursor: noticeLoading ? "not-allowed" : "pointer",
              }}
            >
              {noticeLoading ? "생성 중..." : "내용증명(통지서) 초안 생성"}
            </button>
          </div>

          {noticeDraft && (
            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              <div style={{ fontSize: 12, opacity: 0.75 }}>
                아래 초안은 빈칸(____)을 채우고, 사실관계/기한/금액을 검토한 뒤 사용하세요.
              </div>
              <textarea
                value={noticeDraft}
                onChange={(e) => setNoticeDraft(e.target.value)}
                rows={14}
                style={{ padding: 10, border: "1px solid #ddd", borderRadius: 8, whiteSpace: "pre-wrap" }}
              />
            </div>
          )}
        </div>

        {errorMsg && <pre style={{ whiteSpace: "pre-wrap", color: "crimson" }}>{errorMsg}</pre>}
      </div>
    </section>
  );
}
