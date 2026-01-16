"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ContractsOverdueSyncClient() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const res = await fetch("/api/contracts/sync-overdue", { method: "POST" });
      if (!res.ok) return;
      const json = await res.json().catch(() => null);
      if (!json || cancelled) return;

      if (json.updated && json.updated > 0) {
        router.refresh();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
