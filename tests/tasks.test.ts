import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { INTERRUPTED_MESSAGE, STALE_AFTER_MS, getTask, recoverInterruptedTasks, retryTask } from "@/lib/tasks-service";
import { createWorkspace } from "./support/factories";

async function stuckTask(workspaceId: string, minutesAgo: number) {
  const task = await db.task.create({
    data: { workspaceId, prompt: "Plan a campaign", agentId: "marketing", routing: "manual", status: "running" },
  });
  const past = new Date(Date.now() - minutesAgo * 60_000);
  // Simulate a task that stopped making progress in the past.
  await db.task.update({ where: { id: task.id }, data: { updatedAt: past } });
  return task;
}

describe("interrupted tasks", () => {
  it("leaves recently active tasks alone", async () => {
    const ws = await createWorkspace();
    const task = await stuckTask(ws.id, 1);
    expect(await recoverInterruptedTasks(ws.id)).toBe(0);
    expect((await db.task.findUniqueOrThrow({ where: { id: task.id } })).status).toBe("running");
  });

  it(`marks tasks with no progress for ${STALE_AFTER_MS / 60000} minutes as interrupted`, async () => {
    const ws = await createWorkspace();
    const task = await stuckTask(ws.id, 15);
    const seen = await getTask(ws.id, task.id);
    expect(seen?.status).toBe("failed");
    expect(seen?.error).toBe(INTERRUPTED_MESSAGE);
    expect(await db.activityEvent.count({ where: { workspaceId: ws.id, type: "task.interrupted" } })).toBe(1);
  });

  it("lets a failed task be retried, but not a finished one", async () => {
    const ws = await createWorkspace();
    const task = await stuckTask(ws.id, 15);
    await recoverInterruptedTasks(ws.id);
    expect(await retryTask(ws.id, task.id)).toEqual({ ok: true, taskId: task.id });
    expect((await db.task.findUniqueOrThrow({ where: { id: task.id } })).status).toBe("queued");
    expect((await retryTask(ws.id, task.id)).ok).toBe(false);
  });
});
