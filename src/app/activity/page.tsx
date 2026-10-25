import Link from "next/link";
import { Suspense } from "react";
import { getCurrentWorkspace } from "@/lib/workspace";
import { listActivity } from "@/core/activity";
import { getAgent } from "@/agents/registry";
import { LocalTime } from "@/components/local-time";

export const metadata = { title: "Activity log · ThePlatform" };

function who(actor: string) {
  if (actor === "founder") return { icon: "👤", name: "You" };
  if (actor === "system") return { icon: "⚙️", name: "ThePlatform" };
  const agent = getAgent(actor);
  return { icon: agent?.icon ?? "🤖", name: agent?.name ?? actor };
}

const LINKS: Record<string, (id: string) => string> = {
  task: (id) => `/tasks/${id}`,
  goal: () => "/goals",
  knowledge: () => "/brain",
  agent: () => "/team",
};

async function Events() {
  const workspace = await getCurrentWorkspace();
  const events = await listActivity(workspace.id, 200);

  if (events.length === 0) {
    return <p className="text-sm text-zinc-500">Nothing has happened yet. Actions you and your agents take will be recorded here.</p>;
  }

  return (
    <ol className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
      {events.map((event) => {
        const actor = who(event.actor);
        const href = event.entityType && LINKS[event.entityType]?.(event.entityId);
        return (
          <li key={event.id} className="flex items-start gap-3 p-4 text-sm">
            <span className="text-lg" aria-hidden>
              {actor.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p>
                <strong className="font-medium">{actor.name}</strong>{" "}
                <span className="text-zinc-700 dark:text-zinc-300">{event.message}</span>
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                <LocalTime iso={event.createdAt.toISOString()} />
                {href && (
                  <>
                    {" · "}
                    <Link href={href} className="text-indigo-600 hover:underline">
                      View
                    </Link>
                  </>
                )}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function ActivityPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Activity log</h1>
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
          A permanent record of what you, ThePlatform and your agents did, and when. Newest first.
        </p>
      </header>
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading activity…</p>}>
        <Events />
      </Suspense>
    </div>
  );
}
