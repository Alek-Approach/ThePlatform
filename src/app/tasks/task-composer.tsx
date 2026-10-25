"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SubmitTaskResult } from "@/core/orchestrator";

type ActiveAgent = { id: string; name: string; icon: string; exampleTasks: string[] };

export function TaskComposer({ agents }: { agents: ActiveAgent[] }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [agentId, setAgentId] = useState("auto");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (agents.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
        No agents are active yet.{" "}
        <Link href="/team" className="font-semibold underline">
          Switch on an agent
        </Link>{" "}
        to start giving tasks.
      </div>
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, agentId }),
      });
      const result = (await response.json()) as SubmitTaskResult;
      if (!result.ok) throw new Error(result.message);
      router.push(`/tasks/${result.taskId}`);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Couldn't send the task. Please try again.");
      setSending(false);
    }
  }

  const examples = agents.flatMap((a) => a.exampleTasks.slice(0, 1).map((t) => ({ text: t, icon: a.icon })));

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <label className="text-sm font-medium" htmlFor="task-prompt">
        What would you like your AI team to do?
      </label>
      <textarea
        id="task-prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={3}
        placeholder="Describe the task in your own words…"
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-indigo-900"
      />

      <div className="flex flex-wrap gap-2">
        {examples.map((ex) => (
          <button
            key={ex.text}
            type="button"
            onClick={() => setPrompt(ex.text)}
            className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600 hover:border-indigo-300 hover:text-indigo-700 dark:border-zinc-700 dark:text-zinc-400"
          >
            {ex.icon} {ex.text}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          Assign to
          <select
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="auto">✨ Let ThePlatform choose</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.icon} {a.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={sending || prompt.trim().length === 0}
          className="ml-auto rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
        >
          {sending ? "Sending…" : "Give task"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
