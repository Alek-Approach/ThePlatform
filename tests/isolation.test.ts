import { beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createKnowledgeItem, listKnowledge, setKnowledgeStatus, verifyKnowledgeItem } from "@/brain/knowledge";
import { createGoal, listGoals, recordMeasurement, setGoalStatus } from "@/brain/goals";
import { getTeam, setAgentActive } from "@/lib/agents-service";
import { getTask, listTasks, retryTask } from "@/lib/tasks-service";
import { listActivity } from "@/core/activity";
import { createWorkspace } from "./support/factories";

// Two separate businesses. Nothing belonging to Alpha may be visible to, or
// changeable from, Beta, and the other way round.
let alpha: string, beta: string;
let alphaKnowledge: string, alphaGoal: string, alphaTask: string;

beforeAll(async () => {
  alpha = (await createWorkspace("Alpha Ltd")).id;
  beta = (await createWorkspace("Beta Ltd")).id;

  alphaKnowledge = ((await createKnowledgeItem(alpha, { kind: "policy", title: "Secret pricing", content: "Confidential", source: "user" }, "founder")) as { value: { id: string } }).value.id;
  alphaGoal = ((await createGoal(alpha, { title: "Alpha revenue goal", metric: "revenue", targetValue: 1000 })) as { value: { id: string } }).value.id;
  alphaTask = (await db.task.create({ data: { workspaceId: alpha, prompt: "Alpha's private task", agentId: "marketing", routing: "manual", status: "failed" } })).id;
  await setAgentActive(alpha, "marketing", true);
});

describe("workspace isolation", () => {
  it("lists only the business's own records", async () => {
    expect(await listKnowledge(beta)).toHaveLength(0);
    expect(await listGoals(beta)).toHaveLength(0);
    expect(await listTasks(beta)).toHaveLength(0);
    expect((await listActivity(beta)).some((e) => e.message.includes("Secret pricing"))).toBe(false);
  });

  it("can't open another business's task", async () => {
    expect(await getTask(beta, alphaTask)).toBeNull();
  });

  it("can't change another business's records", async () => {
    expect((await verifyKnowledgeItem(beta, alphaKnowledge)).ok).toBe(false);
    expect((await setKnowledgeStatus(beta, alphaKnowledge, "archived")).ok).toBe(false);
    expect((await recordMeasurement(beta, alphaGoal, { value: 999 })).ok).toBe(false);
    expect((await setGoalStatus(beta, alphaGoal, "archived")).ok).toBe(false);
    expect((await retryTask(beta, alphaTask)).ok).toBe(false);

    const knowledge = await db.knowledgeItem.findUniqueOrThrow({ where: { id: alphaKnowledge } });
    expect(knowledge.source).toBe("user");
    expect(knowledge.status).toBe("active");
    const goal = await db.goal.findUniqueOrThrow({ where: { id: alphaGoal } });
    expect(goal.currentValue).toBe(0);
    expect(goal.status).toBe("active");
  });

  it("can't link its knowledge to another business's goal", async () => {
    const result = await createKnowledgeItem(beta, { kind: "other", title: "Sneaky link", content: "Trying", source: "user", goalId: alphaGoal }, "founder");
    expect(result.ok).toBe(false);
  });

  it("keeps agent switches separate", async () => {
    const betaTeam = await getTeam(beta);
    expect(betaTeam.find((m) => m.agent.id === "marketing")?.active).toBe(false);
  });

  it("writes activity only to the business that acted", async () => {
    const alphaEvents = await listActivity(alpha);
    const betaEvents = await listActivity(beta);
    expect(alphaEvents.length).toBeGreaterThan(0);
    expect(betaEvents.every((e) => e.workspaceId === beta)).toBe(true);
  });
});
