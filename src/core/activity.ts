import "server-only";
import { db } from "@/lib/db";
import { type Actor, actorName } from "@/brain/labels";

export type ActivityInput = {
  type: string; // e.g. "task.completed"
  actor: Actor;
  message: string; // plain English, shown on the Activity Log page
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
};

// Records an event in the activity log. Logging must never break the action
// being logged, so problems are reported to the server console instead.
export async function logActivity(workspaceId: string, event: ActivityInput): Promise<void> {
  try {
    await db.activityEvent.create({
      data: {
        workspaceId,
        type: event.type,
        actor: actorName(event.actor),
        message: event.message,
        entityType: event.entityType ?? "",
        entityId: event.entityId ?? "",
        details: event.details ? JSON.stringify(event.details) : "",
      },
    });
  } catch (error) {
    console.error("Could not write to the activity log:", error);
  }
}

export function listActivity(workspaceId: string, take = 100) {
  return db.activityEvent.findMany({ where: { workspaceId }, orderBy: { createdAt: "desc" }, take });
}
