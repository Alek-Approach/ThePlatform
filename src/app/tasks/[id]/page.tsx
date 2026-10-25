import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getCurrentWorkspace } from "@/lib/workspace";
import { getTask } from "@/lib/tasks-service";
import { getAgent } from "@/agents/registry";
import { AutoRefresh } from "@/components/auto-refresh";
import { LocalTime } from "@/components/local-time";
import { TaskStatus, isPending } from "@/components/task-status";

export const metadata = { title: "Task · ThePlatform" };

async function TaskDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workspace = await getCurrentWorkspace();
  const task = await getTask(workspace.id, id);
  if (!task) notFound();

  const agent = getAgent(task.agentId);
  const pending = isPending(task.status);

  return (
    <div className="flex flex-col gap-6">
      <AutoRefresh active={pending} />

      <header className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500">
          <TaskStatus status={task.status} />
          <LocalTime iso={task.createdAt.toISOString()} />
          {task.aiMode === "mock" && (
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs dark:bg-zinc-800">Sample answer (mock mode)</span>
          )}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{task.prompt}</h1>
        <p className="flex items-center gap-2 text-sm">
          <span className="text-xl" aria-hidden>
            {agent?.icon ?? "🤖"}
          </span>
          <span>
            <strong>{agent?.name ?? task.agentId}</strong>
            <span className="text-zinc-500"> · {task.routing === "auto" ? `Chosen by ThePlatform: ${task.routingReason}` : task.routingReason}</span>
          </span>
        </p>
      </header>

      {pending && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <span className="h-3 w-3 animate-ping rounded-full bg-amber-500" />
          The {agent?.name ?? "agent"} is working on this. This page updates by itself.
        </div>
      )}

      {task.status === "failed" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          <strong>This task didn&apos;t finish.</strong> {task.error}
        </div>
      )}

      {task.status === "completed" && (
        <article className="prose prose-zinc max-w-none rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:prose-invert dark:border-zinc-800 dark:bg-zinc-900">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{task.output}</ReactMarkdown>
        </article>
      )}
    </div>
  );
}

export default function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="flex flex-col gap-4">
      <Link href="/tasks" className="text-sm font-medium text-indigo-600 hover:underline">
        ← All tasks
      </Link>
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading task…</p>}>
        <TaskDetail params={params} />
      </Suspense>
    </div>
  );
}
