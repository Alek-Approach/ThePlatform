"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RetryTaskResult } from "@/lib/tasks-service";

export function RetryButton({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function retry() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/tasks/${taskId}/retry`, { method: "POST" });
      const result = (await response.json()) as RetryTaskResult;
      if (!result.ok) throw new Error(result.message);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Couldn't retry. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="mt-3 flex items-center gap-3">
      <button
        type="button"
        onClick={retry}
        disabled={busy}
        className="rounded-lg bg-red-700 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
      >
        {busy ? "Retrying…" : "Retry"}
      </button>
      {error && <span className="text-sm">{error}</span>}
    </span>
  );
}
