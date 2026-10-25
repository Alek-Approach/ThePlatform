import "server-only";
import { db } from "@/lib/db";
import { AGENTS, getAgent } from "@/agents/registry";
import { logActivity } from "@/core/activity";

// Returns every agent with whether it is switched on for this workspace.
export async function getTeam(workspaceId: string) {
  const activations = await db.agentActivation.findMany({ where: { workspaceId } });
  const active = new Set(activations.filter((a) => a.active).map((a) => a.agentId));
  return AGENTS.map((agent) => ({ agent, active: active.has(agent.id) }));
}

export type SetAgentResult = { ok: true; agentId: string; active: boolean } | { ok: false; message: string };

// Switches one agent on or off for this workspace.
export async function setAgentActive(workspaceId: string, agentId: string, active: boolean): Promise<SetAgentResult> {
  const agent = getAgent(agentId);
  if (!agent) return { ok: false, message: "That agent doesn't exist." };

  try {
    await db.agentActivation.upsert({
      where: { workspaceId_agentId: { workspaceId, agentId } },
      create: { workspaceId, agentId, active },
      update: { active },
    });
    await logActivity(workspaceId, {
      type: active ? "agent.activated" : "agent.deactivated",
      actor: "founder",
      message: `${active ? "Activated" : "Switched off"} the ${agent.name}.`,
      entityType: "agent",
      entityId: agentId,
    });
    return { ok: true, agentId, active };
  } catch (error) {
    console.error(`Switching agent ${agentId} failed:`, error);
    return { ok: false, message: "Something went wrong. Please try again." };
  }
}
