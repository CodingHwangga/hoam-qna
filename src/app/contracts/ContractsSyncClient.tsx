"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ContractsSyncClient() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const res = await fetch("/api/contracts/sync", { method: "POST" });
      if (!res.ok) return;
      const json = await res.json().catch(() => null);
      if (!json || cancelled) return;

      // 만료 계약이 1건이라도 업데이트되면 목록 새로고침
      if (json.updatedCount && json.updatedCount > 0) {
        router.refresh();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
