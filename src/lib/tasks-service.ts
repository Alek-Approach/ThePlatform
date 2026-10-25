import "server-only";
import { db } from "@/lib/db";
import { logActivity } from "@/core/activity";

// Every read is limited to one workspace, so businesses never see each other's tasks.

/** A task "working" this long without any progress was interrupted (e.g. the app restarted). */
export const STALE_AFTER_MS = 10 * 60 * 1000;

export const INTERRUPTED_MESSAGE =
  "This task was interrupted before it finished (for example, the app was restarted). Click Retry to run it again.";

/** Marks tasks that stopped making progress as failed, so they never look stuck forever. */
export async function recoverInterruptedTasks(workspaceId: string, now = new Date()) {
  const cutoff = new Date(now.getTime() - STALE_AFTER_MS);
  const stale = await db.task.findMany({
    where: { workspaceId, status: { in: ["queued", "running"] }, updatedAt: { lt: cutoff } },
  });
  for (const task of stale) {
    await db.task.update({
      where: { id: task.id },
      data: { status: "failed", error: INTERRUPTED_MESSAGE, completedAt: now },
    });
    await logActivity(workspaceId, {
      type: "task.interrupted",
      actor: "system",
      message: `A task was interrupted and marked as not finished: "${task.prompt.slice(0, 120)}".`,
      entityType: "task",
      entityId: task.id,
    });
  }
  return stale.length;
}

export async function listTasks(workspaceId: string, take = 50) {
  await recoverInterruptedTasks(workspaceId);
  return db.task.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" }, take });
}

export async function getTask(workspaceId: string, taskId: string) {
  await recoverInterruptedTasks(workspaceId);
  return db.task.findFirst({ where: { id: taskId, workspaceId } });
}

export type RetryTaskResult = { ok: true; taskId: string } | { ok: false; message: string };

/** Puts a failed task back in the queue so it runs again. */
export async function retryTask(workspaceId: string, taskId: string): Promise<RetryTaskResult> {
  const task = await db.task.findFirst({ where: { id: taskId, workspaceId } });
  if (!task) return { ok: false, message: "That task wasn't found." };
  if (task.status !== "failed") return { ok: false, message: "Only tasks that didn't finish can be retried." };

  await db.task.update({ where: { id: taskId }, data: { status: "queued", error: "", completedAt: null } });
  await logActivity(workspaceId, {
    type: "task.retried",
    actor: "founder",
    message: `Retried the task "${task.prompt.slice(0, 120)}".`,
    entityType: "task",
    entityId: taskId,
  });
  return { ok: true, taskId };
}
