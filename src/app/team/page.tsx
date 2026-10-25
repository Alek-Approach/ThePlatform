import { Suspense } from "react";
import { getCurrentWorkspace } from "@/lib/workspace";
import { getTeam } from "@/lib/agents-service";
import { getAgent } from "@/agents/registry";
import { AgentCard, type AgentCardData } from "./agent-card";

export const metadata = { title: "AI team · ThePlatform" };

async function Team() {
  const workspace = await getCurrentWorkspace();
  const team = await getTeam(workspace.id);
  const activeCount = team.filter((member) => member.active).length;

  const cards: AgentCardData[] = team.map(({ agent, active }) => ({
    id: agent.id,
    name: agent.name,
    icon: agent.icon,
    tagline: agent.tagline,
    description: agent.description,
    capabilities: agent.capabilities,
    exampleTasks: agent.exampleTasks,
    worksWith: agent.canConsult.map((id) => getAgent(id)?.name ?? id),
    actionsNeedingApproval: agent.actionsNeedingApproval,
    active,
  }));

  return (
    <>
      <p className="text-sm text-zinc-500">
        {activeCount} of {team.length} agents active
      </p>
      <div className="flex flex-col gap-5">
        {cards.map((card) => (
          <AgentCard key={card.id} agent={card} />
        ))}
      </div>
    </>
  );
}

export default function TeamPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Your AI team</h1>
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Switch on the agents you want working for your business. Active agents can take on tasks and ask each other
          for help. Nothing they propose happens without your approval.
        </p>
      </header>
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading your team…</p>}>
        <Team />
      </Suspense>
    </div>
  );
}
