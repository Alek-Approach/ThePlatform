"use client";

import { secondaryButtonClass, useJsonAction } from "@/components/use-json-action";

export function KnowledgeActions({ id, source, status }: { id: string; source: string; status: string }) {
  const { run, busy, error } = useJsonAction();
  const act = (action: "verify" | "archive" | "restore") => run(`/api/knowledge/${id}`, "PATCH", { action });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "active" && source !== "verified" && (
        <button type="button" disabled={busy} onClick={() => act("verify")} className={secondaryButtonClass} title="Confirm this is a true business fact">
          ✓ Mark as verified
        </button>
      )}
      {status === "active" ? (
        <button type="button" disabled={busy} onClick={() => act("archive")} className={secondaryButtonClass} title="Hide from agents (not deleted)">
          Archive
        </button>
      ) : (
        <button type="button" disabled={busy} onClick={() => act("restore")} className={secondaryButtonClass}>
          Restore
        </button>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
