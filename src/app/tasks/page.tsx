import Link from "next/link";
import { Suspense } from "react";
import { getCurrentWorkspace } from "@/lib/workspace";
import { getTeam } from "@/lib/agents-service";
import { listTasks } from "@/lib/tasks-service";
import { getAgent } from "@/agents/registry";
import { AutoRefresh } from "@/components/auto-refresh";
import { LocalTime } from "@/components/local-time";
import { TaskStatus, isPending } from "@/components/task-status";
import { TaskComposer } from "./task-composer";

export const metadata = { title: "Tasks · ThePlatform" };

async function Composer() {
  const workspace = await getCurrentWorkspace();
  const team = await getTeam(workspace.id);
  const agents = team
    .filter((m) => m.active)
    .map(({ agent }) => ({ id: agent.id, name: agent.name, icon: agent.icon, exampleTasks: agent.exampleTasks }));
  return <TaskComposer agents={agents} />;
}

async function TaskList() {
  const workspace = await getCurrentWorkspace();
  const tasks = await listTasks(workspace.id);

  if (tasks.length === 0) {
    return <p className="text-sm text-zinc-500">No tasks yet. Your first task will appear here.</p>;
  }

  return (
    <ul className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
      <AutoRefresh active={tasks.some((t) => isPending(t.status))} />
      {tasks.map((task) => {
        const agent = getAgent(task.agentId);
        return (
          <li key={task.id}>
            <Link href={`/tasks/${task.id}`} className="flex items-start gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
              <span className="text-2xl" aria-hidden>
                {agent?.icon ?? "🤖"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{task.prompt}</p>
                <p className="mt-0.5 truncate text-sm text-zinc-500">
                  {task.status === "completed" ? task.summary : task.status === "failed" ? task.error : agent?.name}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-zinc-500">
                <TaskStatus status={task.status} />
                <LocalTime iso={task.createdAt.toISOString()} />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function TasksPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Tasks</h1>
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Ask for anything in plain English. ThePlatform picks the right agent, or you can choose one yourself.
        </p>
      </header>
      <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />}>
        <Composer />
      </Suspense>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Recent tasks</h2>
        <Suspense fallback={<p className="text-sm text-zinc-500">Loading tasks…</p>}>
          <TaskList />
        </Suspense>
      </section>
    </div>
  );
}
