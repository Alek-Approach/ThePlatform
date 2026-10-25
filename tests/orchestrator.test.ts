import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { setAgentActive } from "@/lib/agents-service";
import { runTask, submitTask } from "@/core/orchestrator";
import { createWorkspace } from "./support/factories";

async function workspaceWithAgents(...agentIds: string[]) {
  const ws = await createWorkspace("Sunrise Bakery");
  for (const id of agentIds) await setAgentActive(ws.id, id, true);
  return ws;
}

describe("task submission and routing", () => {
  it("refuses tasks when no agent is active", async () => {
    const ws = await createWorkspace();
    const result = await submitTask(ws.id, { prompt: "Who are my competitors?" });
    expect(result).toEqual({ ok: false, message: expect.stringContaining("No agents are active") });
  });

  it("rejects tasks that are too short", async () => {
    const ws = await workspaceWithAgents("marketing");
    const result = await submitTask(ws.id, { prompt: "hi" });
    expect(result.ok).toBe(false);
  });

  it.each([
    ["Who are my main competitors and how do they price?", "market-research"],
    ["Write three Instagram posts for our launch", "marketing"],
    ["Should we expand to a second location?", "business-strategy"],
  ])("routes %j to %s", async (prompt, expected) => {
    const ws = await workspaceWithAgents("market-research", "marketing", "business-strategy");
    const result = await submitTask(ws.id, { prompt });
    expect(result.ok).toBe(true);
    const task = await db.task.findUniqueOrThrow({ where: { id: (result as { taskId: string }).taskId } });
    expect(task.agentId).toBe(expected);
    expect(task.routing).toBe("auto");
    expect(task.routingReason).not.toBe("");
  });

  it("only routes to active agents", async () => {
    const ws = await workspaceWithAgents("business-strategy");
    const result = await submitTask(ws.id, { prompt: "Write an email newsletter" });
    const task = await db.task.findUniqueOrThrow({ where: { id: (result as { taskId: string }).taskId } });
    expect(task.agentId).toBe("business-strategy");
  });

  it("refuses a switched-off agent chosen by hand", async () => {
    const ws = await workspaceWithAgents("business-strategy");
    const result = await submitTask(ws.id, { prompt: "Write an email newsletter", agentId: "marketing" });
    expect(result).toEqual({ ok: false, message: expect.stringContaining("switched off") });
  });
});

describe("running tasks (mock mode)", () => {
  it("completes a task with a summary and output", async () => {
    const ws = await workspaceWithAgents("marketing");
    const result = await submitTask(ws.id, { prompt: "Plan a social media campaign" });
    const taskId = (result as { taskId: string }).taskId;
    await runTask(taskId);
    const task = await db.task.findUniqueOrThrow({ where: { id: taskId } });
    expect(task.status).toBe("completed");
    expect(task.summary).toContain("Sunrise Bakery");
    expect(task.output).toContain("Marketing plan");
  });

  it("records a friendly failure instead of crashing", async () => {
    const ws = await workspaceWithAgents("marketing");
    const result = await submitTask(ws.id, { prompt: "Plan a campaign [fail]" });
    const taskId = (result as { taskId: string }).taskId;
    await runTask(taskId);
    const task = await db.task.findUniqueOrThrow({ where: { id: taskId } });
    expect(task.status).toBe("failed");
    expect(task.error).toMatch(/couldn't finish/);
  });
});
