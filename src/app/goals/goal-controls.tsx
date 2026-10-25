"use client";

import { useState } from "react";
import { GOAL_STATUSES } from "@/brain/labels";
import { inputClass, secondaryButtonClass, useJsonAction } from "@/components/use-json-action";

export function MeasurementForm({ goalId, metric }: { goalId: string; metric: string }) {
  const { run, busy, error, fieldErrors } = useJsonAction();
  const [formKey, setFormKey] = useState(0);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    if (await run(`/api/goals/${goalId}/measurements`, "POST", data)) setFormKey((k) => k + 1);
  }

  return (
    <form key={formKey} onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <label className="text-xs font-medium">
        New result ({metric})
        <input name="value" type="number" step="any" required className={`${inputClass} w-32`} />
      </label>
      <label className="min-w-40 flex-1 text-xs font-medium">
        Note (optional)
        <input name="note" placeholder="e.g. after the email campaign" className={inputClass} />
      </label>
      <button type="submit" disabled={busy} className={secondaryButtonClass}>
        {busy ? "Saving…" : "Record result"}
      </button>
      {(error || fieldErrors.value) && <span className="w-full text-xs text-red-600">{fieldErrors.value ?? error}</span>}
    </form>
  );
}

export function GoalStatusSelect({ goalId, status }: { goalId: string; status: string }) {
  const { run, busy, error } = useJsonAction();
  return (
    <span className="flex items-center gap-2">
      <select
        aria-label="Goal status"
        value={status}
        disabled={busy}
        onChange={(e) => run(`/api/goals/${goalId}`, "PATCH", { status: e.target.value })}
        className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-950"
      >
        {Object.entries(GOAL_STATUSES).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
