"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SetAgentResult } from "@/lib/agents-service";

export type AgentCardData = {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  description: string;
  capabilities: string[];
  exampleTasks: string[];
  worksWith: string[];
  actionsNeedingApproval: string[];
  active: boolean;
};

export function AgentCard({ agent }: { agent: AgentCardData }) {
  const router = useRouter();
  const [active, setActive] = useState(agent.active);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    const next = !active;
    setActive(next); // show the change straight away
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/agents/${agent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: next }),
      });
      const result = (await response.json()) as SetAgentResult;
      if (!result.ok) throw new Error(result.message);
      router.refresh();
    } catch (e) {
      setActive(!next); // undo on failure
      setError(e instanceof Error && e.message ? e.message : "Couldn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <article
      className={`flex flex-col gap-4 rounded-xl border bg-white p-6 shadow-sm transition dark:bg-zinc-900 ${
        active ? "border-indigo-300 ring-1 ring-indigo-200 dark:border-indigo-700 dark:ring-indigo-900" : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="text-3xl" aria-hidden>
            {agent.icon}
          </span>
          <div>
            <h2 className="text-lg font-semibold">{agent.name}</h2>
            <p className="text-sm text-zinc-500">{agent.tagline}</p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={active}
          aria-label={`${active ? "Deactivate" : "Activate"} ${agent.name}`}
          onClick={toggle}
          disabled={saving}
          className="flex shrink-0 items-center gap-2 text-sm font-medium disabled:opacity-60"
        >
          <span className={active ? "text-indigo-700 dark:text-indigo-300" : "text-zinc-500"}>{active ? "Active" : "Off"}</span>
          <span
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
              active ? "bg-indigo-600" : "bg-zinc-300 dark:bg-zinc-700"
            }`}
          >
            <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${active ? "translate-x-5" : "translate-x-0.5"}`} />
          </span>
        </button>
      </header>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <p className="text-sm text-zinc-700 dark:text-zinc-300">{agent.description}</p>

      <div className="grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <h3 className="font-medium">What it can do</h3>
          <ul className="mt-1 list-disc pl-5 text-zinc-600 dark:text-zinc-400">
            {agent.capabilities.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-medium">Try asking</h3>
          <ul className="mt-1 flex flex-col gap-1 text-zinc-600 dark:text-zinc-400">
            {agent.exampleTasks.map((t) => (
              <li key={t} className="italic">“{t}”</li>
            ))}
          </ul>
        </div>
      </div>

      <footer className="flex flex-wrap gap-x-6 gap-y-2 border-t border-zinc-100 pt-4 text-xs text-zinc-500 dark:border-zinc-800">
        <span>
          <strong className="font-medium text-zinc-700 dark:text-zinc-300">Works with:</strong> {agent.worksWith.join(", ")}
        </span>
        <span>
          <strong className="font-medium text-zinc-700 dark:text-zinc-300">Asks your approval before:</strong>{" "}
          {agent.actionsNeedingApproval.join(", ").toLowerCase()}
        </span>
      </footer>
    </article>
  );
}
