import Link from "next/link";
import { Suspense } from "react";
import { getCurrentWorkspace } from "@/lib/workspace";
import { profileCompleteness } from "@/lib/profile";
import { getTeam } from "@/lib/agents-service";

async function ProfileCard() {
  const workspace = await getCurrentWorkspace();
  const percent = profileCompleteness(workspace);
  const hasName = workspace.name.trim() !== "";

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{hasName ? workspace.name : "Set up your company profile"}</h2>
          <p className="text-sm text-zinc-500">
            {percent === 100
              ? "Your profile is complete — your agents have everything they need."
              : "Your agents work better the more they know about your business."}
          </p>
        </div>
        <Link
          href="/profile"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          {hasName ? "Edit profile" : "Start profile"}
        </Link>
      </div>
      <div className="mt-5">
        <div className="flex justify-between text-xs text-zinc-500">
          <span>Profile completeness</span>
          <span>{percent}%</span>
        </div>
        <div className="mt-1 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div className="h-2 rounded-full bg-indigo-600" style={{ width: `${percent}%` }} />
        </div>
      </div>
    </section>
  );
}

async function TeamSummary() {
  const workspace = await getCurrentWorkspace();
  const team = await getTeam(workspace.id);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">AI team</h2>
        <Link href="/team" className="text-sm font-medium text-indigo-600 hover:underline">
          Manage team →
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {team.map(({ agent, active }) => (
          <Link
            key={agent.id}
            href="/team"
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-indigo-300 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span className="text-2xl" aria-hidden>
              {agent.icon}
            </span>
            <h3 className="mt-2 font-semibold">{agent.name}</h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{agent.tagline}</p>
            <span
              className={`mt-4 inline-block rounded-full px-3 py-1 text-xs font-medium ${
                active
                  ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {active ? "● Active" : "Off"}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Your AI business team</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">Start with your company profile, then put your agents to work.</p>
      </header>

      <Suspense fallback={<div className="h-36 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />}>
        <ProfileCard />
      </Suspense>

      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />}>
        <TeamSummary />
      </Suspense>
    </div>
  );
}
