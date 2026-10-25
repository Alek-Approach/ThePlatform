import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";
import { logActivity } from "@/core/activity";
import { GOAL_STATUSES, type GoalStatus } from "./labels";
import { goalReached } from "./progress";
import { fromZodError, type Result } from "./result";

// Business goals and the results recorded against them (performance memory).

const number = (label: string) =>
  z.coerce.number({ message: `${label} must be a number.` }).refine(Number.isFinite, `${label} must be a number.`);

const createSchema = z.object({
  title: z.string().trim().min(3, "Please describe the goal.").max(200, "Please keep this under 200 characters."),
  metric: z.string().trim().min(1, "What will you measure? (e.g. customers, revenue, posts)").max(60),
  baselineValue: number("Starting value").default(0),
  targetValue: number("Target"),
  deadline: z
    .string()
    .trim()
    .optional()
    .transform((value, ctx) => {
      if (!value) return undefined;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        ctx.addIssue({ code: "custom", message: "Please enter a valid date." });
        return z.NEVER;
      }
      return date;
    }),
});

const measurementSchema = z.object({
  value: number("Value"),
  note: z.string().trim().max(1000).default(""),
});

export async function createGoal(workspaceId: string, input: unknown): Promise<Result<{ id: string }>> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const data = parsed.data;
  if (data.targetValue === data.baselineValue) {
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: { targetValue: "The target should differ from the starting value." } };
  }

  const goal = await db.goal.create({
    data: {
      workspaceId,
      title: data.title,
      metric: data.metric,
      baselineValue: data.baselineValue,
      targetValue: data.targetValue,
      currentValue: data.baselineValue,
      deadline: data.deadline,
    },
  });
  await logActivity(workspaceId, {
    type: "goal.created",
    actor: "founder",
    message: `Created goal "${goal.title}" (target: ${goal.targetValue} ${goal.metric}).`,
    entityType: "goal",
    entityId: goal.id,
  });
  return { ok: true, value: { id: goal.id } };
}

/** Records a real result. The goal's current value becomes this latest result. */
export async function recordMeasurement(workspaceId: string, goalId: string, input: unknown): Promise<Result<{ id: string; reached: boolean }>> {
  const goal = await db.goal.findFirst({ where: { id: goalId, workspaceId } });
  if (!goal) return { ok: false, message: "That goal wasn't found." };

  const parsed = measurementSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);

  const measurement = await db.goalMeasurement.create({
    data: { workspaceId, goalId, value: parsed.data.value, note: parsed.data.note, source: "outcome" },
  });
  const reached = goalReached({ ...goal, currentValue: parsed.data.value });
  await db.goal.update({
    where: { id: goalId },
    data: { currentValue: parsed.data.value, ...(reached && goal.status === "active" ? { status: "achieved" } : {}) },
  });

  await logActivity(workspaceId, {
    type: "goal.measured",
    actor: "founder",
    message: `Recorded ${parsed.data.value} ${goal.metric} for "${goal.title}".${reached && goal.status === "active" ? " Target reached! 🎉" : ""}`,
    entityType: "goal",
    entityId: goalId,
  });
  return { ok: true, value: { id: measurement.id, reached } };
}

export async function setGoalStatus(workspaceId: string, goalId: string, status: string): Promise<Result<{ id: string }>> {
  if (!(status in GOAL_STATUSES)) return { ok: false, message: "Unknown goal status." };
  const goal = await db.goal.findFirst({ where: { id: goalId, workspaceId } });
  if (!goal) return { ok: false, message: "That goal wasn't found." };

  await db.goal.update({ where: { id: goalId }, data: { status } });
  await logActivity(workspaceId, {
    type: "goal.status",
    actor: "founder",
    message: `Marked goal "${goal.title}" as ${GOAL_STATUSES[status as GoalStatus].toLowerCase()}.`,
    entityType: "goal",
    entityId: goalId,
  });
  return { ok: true, value: { id: goalId } };
}

export function listGoals(workspaceId: string) {
  return db.goal.findMany({
    where: { workspaceId, status: { not: "archived" } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { measurements: { orderBy: { recordedAt: "desc" }, take: 10 } },
  });
}
