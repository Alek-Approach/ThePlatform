import { Suspense } from "react";
import { getCurrentWorkspace } from "@/lib/workspace";
import { listGoals } from "@/brain/goals";
import { goalProgressPercent } from "@/brain/progress";
import { LocalTime } from "@/components/local-time";
import { SourceBadge } from "@/components/source-badge";
import { GoalForm } from "./goal-form";
import { GoalStatusSelect, MeasurementForm } from "./goal-controls";

export const metadata = { title: "Goals · ThePlatform" };

const card = "rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900";
const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });

async function Goals() {
  const workspace = await getCurrentWorkspace();
  const goals = await listGoals(workspace.id);

  if (goals.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No goals yet. Add one above, e.g. &quot;Generate 50 qualified leads in 30 days&quot;. Your agents will work
        towards it, and you&apos;ll record real results here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {goals.map((goal) => {
        const percent = goalProgressPercent(goal);
        return (
          <article key={goal.id} className={`${card} flex flex-col gap-4 ${goal.status !== "active" ? "opacity-80" : ""}`}>
            <header className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{goal.title}</h2>
                <p className="text-sm text-zinc-500">
                  {fmt(goal.currentValue)} of {fmt(goal.targetValue)} {goal.metric} · started at {fmt(goal.baselineValue)}
                  {goal.deadline && (
                    <>
                      {" "}
                      · deadline <LocalTime iso={goal.deadline.toISOString()} dateOnly />
                    </>
                  )}
                </p>
              </div>
              <GoalStatusSelect goalId={goal.id} status={goal.status} />
            </header>

            <div>
              <div className="flex justify-between text-xs text-zinc-500">
                <span>Progress</span>
                <span>{percent}%</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className={`h-2 rounded-full ${goal.status === "achieved" ? "bg-green-600" : "bg-indigo-600"}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            {goal.status === "active" && <MeasurementForm goalId={goal.id} metric={goal.metric} />}

            {goal.measurements.length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer text-zinc-500">Recorded results ({goal.measurements.length})</summary>
                <ul className="mt-2 flex flex-col gap-2">
                  {goal.measurements.map((m) => (
                    <li key={m.id} className="flex flex-wrap items-center gap-2">
                      <SourceBadge source={m.source} />
                      <strong>
                        {fmt(m.value)} {goal.metric}
                      </strong>
                      <span className="text-zinc-500">
                        <LocalTime iso={m.recordedAt.toISOString()} />
                        {m.note && ` · ${m.note}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </article>
        );
      })}
    </div>
  );
}

export default function GoalsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Goals</h1>
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Set measurable goals and record real results as you go. Progress is calculated from the numbers you enter, not
          guessed by AI.
        </p>
      </header>
      <section className={card}>
        <h2 className="mb-4 text-lg font-semibold">Add a goal</h2>
        <GoalForm />
      </section>
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading goals…</p>}>
        <Goals />
      </Suspense>
    </div>
  );
}
