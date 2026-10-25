"use client";

import { useState } from "react";
import { buttonClass, inputClass, useJsonAction } from "@/components/use-json-action";

export function GoalForm() {
  const { run, busy, error, fieldErrors } = useJsonAction();
  const [formKey, setFormKey] = useState(0);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    if (await run("/api/goals", "POST", data)) setFormKey((k) => k + 1);
  }

  const err = (name: string) => fieldErrors[name] && <span className="mt-1 block text-xs font-normal text-red-600">{fieldErrors[name]}</span>;

  return (
    <form key={formKey} onSubmit={submit} className="grid gap-4 sm:grid-cols-4">
      <label className="block text-sm font-medium sm:col-span-4">
        Goal
        <input name="title" placeholder="e.g. Acquire 100 customers in 90 days" className={inputClass} />
        {err("title")}
      </label>
      <label className="block text-sm font-medium">
        What you measure
        <input name="metric" placeholder="customers" className={inputClass} />
        {err("metric")}
      </label>
      <label className="block text-sm font-medium">
        Starting value
        <input name="baselineValue" type="number" step="any" defaultValue="0" className={inputClass} />
        {err("baselineValue")}
      </label>
      <label className="block text-sm font-medium">
        Target
        <input name="targetValue" type="number" step="any" placeholder="100" className={inputClass} />
        {err("targetValue")}
      </label>
      <label className="block text-sm font-medium">
        Deadline (optional)
        <input name="deadline" type="date" className={inputClass} />
        {err("deadline")}
      </label>
      <div className="flex items-center gap-3 sm:col-span-4">
        <button type="submit" disabled={busy} className={buttonClass}>
          {busy ? "Saving…" : "Add goal"}
        </button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  );
}
