import Link from "next/link";
import { Suspense } from "react";
import { getCurrentWorkspace } from "@/lib/workspace";
import { profileCompleteness } from "@/lib/profile";

const agents = [
  { name: "Market Research Agent", role: "Studies your market, customers and competitors." },
  { name: "Marketing Agent", role: "Plans campaigns, content and messaging." },
  { name: "Business Strategy Agent", role: "Turns insights into goals, plans and priorities." },
];

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

      <section className="grid gap-4 sm:grid-cols-3">
        {agents.map((agent) => (
          <div
            key={agent.name}
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <h2 className="font-semibold">{agent.name}</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{agent.role}</p>
            <span className="mt-4 inline-block rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              Coming in Step 2
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}
