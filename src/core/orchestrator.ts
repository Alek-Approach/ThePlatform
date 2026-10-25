import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAIProvider, FriendlyError } from "@/ai";
import { getAgent } from "@/agents/registry";
import { getTeam } from "@/lib/agents-service";
import { toProfile } from "@/lib/profile";
import { logActivity } from "./activity";

// The orchestrator is ThePlatform's "manager": it checks a new task, decides which
// agent should do it, records it, and later runs it and stores the result.

export const AUTO = "auto";

const submitSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(5, "Please describe the task in a few more words.")
    .max(4000, "Please keep the task under 4,000 characters."),
  agentId: z.string().default(AUTO),
});

export type SubmitTaskResult = { ok: true; taskId: string } | { ok: false; message: string };

/** Step 1: check the task, choose the agent and save it as "queued". */
export async function submitTask(workspaceId: string, input: unknown): Promise<SubmitTaskResult> {
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { prompt, agentId } = parsed.data;

  try {
    const workspace = await db.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
    const activeAgents = (await getTeam(workspaceId)).filter((m) => m.active).map((m) => m.agent);
    if (activeAgents.length === 0) {
      return { ok: false, message: "No agents are active yet. Switch one on in the AI team page first." };
    }

    const ai = getAIProvider();
    let chosen: { agentId: string; reason: string };
    if (agentId === AUTO) {
      chosen = await ai.routeTask({ task: prompt, profile: toProfile(workspace), agents: activeAgents });
      if (!activeAgents.some((a) => a.id === chosen.agentId)) chosen = { agentId: activeAgents[0].id, reason: "Assigned to the first active agent." };
    } else {
      const agent = getAgent(agentId);
      if (!agent) return { ok: false, message: "That agent doesn't exist." };
      if (!activeAgents.some((a) => a.id === agentId)) {
        return { ok: false, message: `The ${agent.name} is switched off. Activate it in the AI team page first.` };
      }
      chosen = { agentId, reason: "You chose this agent." };
    }

    const task = await db.task.create({
      data: {
        workspaceId,
        prompt,
        agentId: chosen.agentId,
        routing: agentId === AUTO ? "auto" : "manual",
        routingReason: chosen.reason,
        aiMode: ai.mode,
      },
    });
    await logActivity(workspaceId, {
      type: "task.created",
      actor: "founder",
      message: `New task for the ${getAgent(chosen.agentId)?.name}: "${prompt.slice(0, 120)}". ${chosen.reason}`,
      entityType: "task",
      entityId: task.id,
    });
    return { ok: true, taskId: task.id };
  } catch (error) {
    if (error instanceof FriendlyError) return { ok: false, message: error.message };
    console.error("Submitting task failed:", error);
    return { ok: false, message: "Something went wrong while creating the task. Please try again." };
  }
}

/** Step 2: have the chosen agent do the work, then store the result or the error. */
export async function runTask(taskId: string): Promise<void> {
  const task = await db.task.findUnique({ where: { id: taskId }, include: { workspace: true } });
  if (!task || task.status !== "queued") return;

  await db.task.update({ where: { id: taskId }, data: { status: "running" } });

  try {
    const agent = getAgent(task.agentId);
    if (!agent) throw new FriendlyError("This agent is no longer available.");

    const result = await getAIProvider().runAgent({ agent, profile: toProfile(task.workspace), task: task.prompt });
    await db.task.update({
      where: { id: taskId },
      data: { status: "completed", summary: result.summary, output: result.output, completedAt: new Date() },
    });
    await logActivity(task.workspaceId, {
      type: "task.completed",
      actor: { agentId: agent.id },
      message: `The ${agent.name} finished: "${task.prompt.slice(0, 120)}".`,
      entityType: "task",
      entityId: taskId,
    });
  } catch (error) {
    console.error(`Task ${taskId} failed:`, error);
    const message =
      error instanceof FriendlyError
        ? error.message
        : "The agent ran into a problem and couldn't finish this task. Please try again in a moment.";
    await db.task.update({ where: { id: taskId }, data: { status: "failed", error: message, completedAt: new Date() } });
    await logActivity(task.workspaceId, {
      type: "task.failed",
      actor: "system",
      message: `A task didn't finish: "${task.prompt.slice(0, 120)}". ${message}`,
      entityType: "task",
      entityId: taskId,
      details: { error: error instanceof Error ? error.message : String(error) },
    });
  }
}
