import Link from "next/link";
import { Suspense } from "react";
import { getCurrentWorkspace } from "@/lib/workspace";
import { profileCompleteness } from "@/lib/profile";
import { listKnowledge } from "@/brain/knowledge";
import { KNOWLEDGE_KINDS, type KnowledgeKind } from "@/brain/labels";
import { getAgent } from "@/agents/registry";
import { LocalTime } from "@/components/local-time";
import { SourceBadge, SourceLegend } from "@/components/source-badge";
import { KnowledgeForm } from "./knowledge-form";
import { KnowledgeActions } from "./knowledge-actions";

export const metadata = { title: "Business Brain · ThePlatform" };

const card = "rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900";

type Item = Awaited<ReturnType<typeof listKnowledge>>[number];

function KnowledgeRow({ item }: { item: Item }) {
  const by = item.createdBy === "founder" ? "you" : (getAgent(item.createdBy)?.name ?? item.createdBy);
  return (
    <li className="flex flex-col gap-2 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <SourceBadge source={item.source} />
        <span className="text-xs uppercase tracking-wide text-zinc-500">{KNOWLEDGE_KINDS[item.kind as KnowledgeKind] ?? item.kind}</span>
      </div>
      <h3 className="font-medium">{item.title}</h3>
      <p className="whitespace-pre-line text-sm text-zinc-700 dark:text-zinc-300">{item.content}</p>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
        <span>
          Added by {by} · <LocalTime iso={item.createdAt.toISOString()} />
          {item.verifiedAt && (
            <>
              {" "}
              · verified <LocalTime iso={item.verifiedAt.toISOString()} />
            </>
          )}
        </span>
        <KnowledgeActions id={item.id} source={item.source} status={item.status} />
      </div>
    </li>
  );
}

async function ProfileSummary() {
  const workspace = await getCurrentWorkspace();
  return (
    <section className={`${card} flex flex-wrap items-center justify-between gap-4`}>
      <div>
        <h2 className="text-lg font-semibold">Business identity</h2>
        <p className="text-sm text-zinc-500">
          {workspace.name || "Your company"} · profile {profileCompleteness(workspace)}% complete. Every agent reads this first.
        </p>
      </div>
      <Link href="/profile" className="text-sm font-medium text-indigo-600 hover:underline">
        Edit company profile →
      </Link>
    </section>
  );
}

async function Knowledge() {
  const workspace = await getCurrentWorkspace();
  const [active, archived] = await Promise.all([listKnowledge(workspace.id), listKnowledge(workspace.id, "archived")]);

  return (
    <>
      {active.length === 0 ? (
        <p className="py-4 text-sm text-zinc-500">
          Nothing here yet. Add what you know about competitors, customers, products or policies.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {active.map((item) => (
            <KnowledgeRow key={item.id} item={item} />
          ))}
        </ul>
      )}
      {archived.length > 0 && (
        <details className="mt-2 text-sm">
          <summary className="cursor-pointer text-zinc-500">Archived ({archived.length}): hidden from agents, never deleted</summary>
          <ul className="divide-y divide-zinc-100 opacity-70 dark:divide-zinc-800">
            {archived.map((item) => (
              <KnowledgeRow key={item.id} item={item} />
            ))}
          </ul>
        </details>
      )}
    </>
  );
}

export default function BrainPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Business Brain</h1>
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Everything your AI team knows about your business. Each item shows where it came from, so you can always tell
          facts from guesses.
        </p>
      </header>

      <section className={card}>
        <h2 className="mb-3 text-sm font-semibold">What the labels mean</h2>
        <SourceLegend />
      </section>

      <Suspense fallback={<div className="h-24 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-900" />}>
        <ProfileSummary />
      </Suspense>

      <section className={card}>
        <h2 className="text-lg font-semibold">Business knowledge</h2>
        <p className="text-sm text-zinc-500">
          Only you can mark something as <strong>verified</strong>. AI suggestions and assumptions never become facts on
          their own. <em>Agents start reading this knowledge in the next phase of the build.</em>
        </p>
        <div className="mt-5 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-950">
          <KnowledgeForm />
        </div>
        <Suspense fallback={<p className="py-4 text-sm text-zinc-500">Loading…</p>}>
          <Knowledge />
        </Suspense>
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className={card}>
          <h2 className="text-lg font-semibold">Documents</h2>
          <p className="mt-1 text-sm text-zinc-500">Uploading business documents is coming in a later phase.</p>
        </section>
        <section className={card}>
          <h2 className="text-lg font-semibold">Decision history</h2>
          <p className="mt-1 text-sm text-zinc-500">
            When you approve or reject your agents&apos; proposals (coming soon), your decisions are remembered here.
          </p>
        </section>
      </div>
    </div>
  );
}
