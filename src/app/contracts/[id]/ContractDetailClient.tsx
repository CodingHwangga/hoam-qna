"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  contract: any;
};

export default function ContractDetailClient({ contract }: Props) {
  const router = useRouter();

  const [status, setStatus] = useState(contract.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    setLoading(true);
    setError(null);

    const { error } = await supabase
      .from("contracts")
      .update({ status })
      .eq("id", contract.id);

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    alert("계약 상태가 변경되었습니다.");

    // ★ 핵심: 서버 컴포넌트 강제 재요청
    router.refresh();

    window.location.href = "/contracts";
  };

  return (
    <section style={{ marginTop: 24 }}>
      <h2>계약 상태 변경</h2>

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        style={{ marginTop: 8 }}
      >
        <option value="active">active</option>
        <option value="overdue">overdue</option>
        <option value="terminated">terminated</option>
      </select>

      <button
        onClick={onSave}
        disabled={loading}
        style={{ marginLeft: 8 }}
      >
        저장
      </button>

<button
  onClick={async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/contracts/recalc-overdue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contractId: contract.id }),
    });
    setLoading(false);
    if (!res.ok) {
      const t = await res.text();
      setError(t);
      alert("연체 계산 실패");
      return;
    }
    alert("연체 계산 완료");
    router.refresh();
  }}
  disabled={loading}
  style={{ marginLeft: 8 }}
>
  연체 재계산
</button>


      {error && (
        <p style={{ color: "crimson", marginTop: 8 }}>{error}</p>
      )}
    </section>
  );
}
