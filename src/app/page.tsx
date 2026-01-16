import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1>임대인 문서 초안 도우미 (내부 테스트)</h1>
      <p style={{ opacity: 0.7, marginTop: 8 }}>
        본 서비스는 법률 판단이 아닌 문서 초안/가이드 제공 목적의 프로토타입입니다.
      </p>

      <div style={{ marginTop: 18, display: "flex", gap: 12 }}>
        <Link
          href="/contracts"
          style={{
            display: "inline-block",
            padding: "10px 14px",
            border: "1px solid #ddd",
            borderRadius: 8,
            textDecoration: "none",
          }}
        >
          계약서(사건) 관리
        </Link>

        <Link
          href="/questions"
          style={{
            display: "inline-block",
            padding: "10px 14px",
            border: "1px solid #ddd",
            borderRadius: 8,
            textDecoration: "none",
          }}
        >
          질문하기
        </Link>
      </div>

      <hr style={{ margin: "20px 0" }} />

      <p style={{ opacity: 0.7 }}>
        바로가기: <code>/contracts</code> / <code>/questions</code>
      </p>
    </main>
  );
}
