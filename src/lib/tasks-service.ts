import "server-only";
import { db } from "@/lib/db";

// Every read is limited to one workspace, so businesses never see each other's tasks.

export function listTasks(workspaceId: string, take = 50) {
  return db.task.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" }, take });
}

export function getTask(workspaceId: string, taskId: string) {
  return db.task.findFirst({ where: { id: taskId, workspaceId } });
}
