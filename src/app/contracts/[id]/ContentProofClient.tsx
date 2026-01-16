"use client";

import { useEffect, useState } from "react";

type Doc = {
  id: number;
  contract_id: number;
  doc_type: string;
  title: string;
  content: string;
  created_at: string;
  meta?: any;
};

export default function ContentProofClient({ contractId }: { contractId: number }) {
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [title, setTitle] = useState("내용증명 초안");
  const [error, setError] = useState<string | null>(null);

  const [purpose, setPurpose] = useState("rent_overdue");
  const [inputs, setInputs] = useState<Record<string, string>>({});

  const [docs, setDocs] = useState<Doc[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  const loadDocs = async () => {
    setDocsLoading(true);
    const res = await fetch(`/api/docs/contract-documents?contractId=${contractId}`, {
      method: "GET",
    });
    setDocsLoading(false);
    if (!res.ok) return;

    const json = await res.json().catch(() => null);
    if (json?.data) setDocs(json.data);
  };

  useEffect(() => {
    loadDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractId]);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setDraft("");

    // 디버그: 실제로 서버에 뭐 보내는지 확인
    console.log({ contractId, purpose, inputs });

    const res = await fetch("/api/docs/content-proof", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contractId, purpose, inputs }),
    });

    setLoading(false);

    if (!res.ok) {
      setError(await res.text());
      return;
    }

    const json = await res.json().catch(() => null);
    if (!json?.draft) {
      setError("draft 생성 실패");
      return;
    }

    setDraft(json.draft);
  };

  const save = async () => {
    if (!draft.trim()) {
      alert("저장할 내용이 없습니다.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetch("/api/docs/contract-documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contractId,
        docType: `content_proof:${purpose}`,
        title: title.trim() || "내용증명 초안",
        content: draft,
        meta: { purpose, inputs },
      }),
    });

    setLoading(false);

    if (!res.ok) {
      setError(await res.text());
      return;
    }

    alert("저장 완료");
    await loadDocs();
  };

  return (
    <section style={{ marginTop: 28 }}>
      <h2>내용증명 초안</h2>

      <p style={{ opacity: 0.7, marginTop: 6 }}>
        면책: 본 초안은 참고용이며 법적 효력/최종 문구는 보장하지 않습니다. 사용 전 검토하세요.
      </p>

      {/* 목적 선택 */}
      <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
        <select
          value={purpose}
          onChange={(e) => {
            setPurpose(e.target.value);
            setInputs({});
          }}
          style={{ padding: 8 }}
        >
          <option value="rent_overdue">월세 연체 독촉</option>
          <option value="termination_notice">계약 해지/종료 통보</option>
          <option value="moveout_restore">퇴거+원상복구 요청</option>
        </select>

        <button onClick={generate} disabled={loading}>
          {loading ? "생성 중..." : "초안 생성"}
        </button>

        <button onClick={save} disabled={loading}>
          저장
        </button>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="저장 제목"
          style={{ flex: 1, padding: 8 }}
        />
      </div>

      {/* 추가 입력 */}
      <div style={{ marginTop: 12, border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
        <b>추가 입력</b>

        {purpose === "rent_overdue" && (
          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
            <input
              placeholder="미납 월/기간 (예: 2025.12~2026.01)"
              value={inputs.unpaid_period ?? ""}
              onChange={(e) => setInputs({ ...inputs, unpaid_period: e.target.value })}
              style={{ padding: 8 }}
            />
            <input
              placeholder="미납 금액(원) (예: 1400000)"
              value={inputs.unpaid_amount ?? ""}
              onChange={(e) => setInputs({ ...inputs, unpaid_amount: e.target.value })}
              style={{ padding: 8 }}
            />
          </div>
        )}

        {purpose === "termination_notice" && (
          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
            <input
              placeholder="해지/종료 사유 (예: 기간 만료, 차임 연체 등)"
              value={inputs.termination_reason ?? ""}
              onChange={(e) => setInputs({ ...inputs, termination_reason: e.target.value })}
              style={{ padding: 8 }}
            />
            <input
              placeholder="해지/종료 기준일 (YYYY-MM-DD)"
              value={inputs.termination_date ?? ""}
              onChange={(e) => setInputs({ ...inputs, termination_date: e.target.value })}
              style={{ padding: 8 }}
            />
          </div>
        )}

        {purpose === "moveout_restore" && (
          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
            <input
              placeholder="퇴거 요청 사유"
              value={inputs.moveout_reason ?? ""}
              onChange={(e) => setInputs({ ...inputs, moveout_reason: e.target.value })}
              style={{ padding: 8 }}
            />
            <input
              placeholder="퇴거 요청 기한 (YYYY-MM-DD)"
              value={inputs.moveout_deadline ?? ""}
              onChange={(e) => setInputs({ ...inputs, moveout_deadline: e.target.value })}
              style={{ padding: 8 }}
            />
            <input
              placeholder="원상복구 요청 범위 (예: 벽지/장판, 청소, 파손 수리 등)"
              value={inputs.restore_scope ?? ""}
              onChange={(e) => setInputs({ ...inputs, restore_scope: e.target.value })}
              style={{ padding: 8 }}
            />
          </div>
        )}
      </div>

      {error && (
        <pre style={{ color: "crimson", whiteSpace: "pre-wrap", marginTop: 10 }}>{error}</pre>
      )}

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="여기에 초안이 생성됩니다."
        style={{ width: "100%", height: 320, marginTop: 12, padding: 12 }}
      />

      {/* 히스토리 */}
      <section style={{ marginTop: 18 }}>
        <h3 style={{ marginBottom: 8 }}>저장된 문서 히스토리</h3>

        {docsLoading ? (
          <p style={{ opacity: 0.7 }}>불러오는 중...</p>
        ) : docs.length === 0 ? (
          <p style={{ opacity: 0.7 }}>아직 저장된 문서가 없습니다.</p>
        ) : (
          <ul style={{ paddingLeft: 18 }}>
            {docs
              .filter((d) => String(d.doc_type || "").startsWith("content_proof:"))
              .map((d) => (
                <li key={d.id} style={{ marginBottom: 12 }}>
                  <div>
                    <b>{d.title}</b>{" "}
                    <span style={{ opacity: 0.6 }}>
                      ({new Date(d.created_at).toLocaleString()})
                    </span>{" "}
                    <span style={{ opacity: 0.6 }}>[{d.doc_type}]</span>
                  </div>

                  <button
                    onClick={() => {
                      setDraft(d.content);
                      const m = d.meta || {};
                      if (m.purpose) setPurpose(m.purpose);
                      setInputs(m.inputs || {});
                    }}
                    style={{ marginTop: 6 }}
                  >
                    불러오기
                  </button>
                </li>
              ))}
          </ul>
        )}
      </section>
    </section>
  );
}
