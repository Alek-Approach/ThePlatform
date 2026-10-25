import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createGoal, recordMeasurement, setGoalStatus } from "@/brain/goals";
import { goalProgressPercent, goalReached } from "@/brain/progress";
import { createWorkspace } from "./support/factories";

describe("goal progress maths", () => {
  it("measures progress from the starting value", () => {
    expect(goalProgressPercent({ baselineValue: 0, targetValue: 50, currentValue: 38 })).toBe(76);
    expect(goalProgressPercent({ baselineValue: 100, targetValue: 120, currentValue: 110 })).toBe(50);
  });
  it("works for goals that should go down (e.g. reduce costs)", () => {
    expect(goalProgressPercent({ baselineValue: 1000, targetValue: 800, currentValue: 900 })).toBe(50);
    expect(goalReached({ baselineValue: 1000, targetValue: 800, currentValue: 790 })).toBe(true);
  });
  it("stays between 0 and 100", () => {
    expect(goalProgressPercent({ baselineValue: 0, targetValue: 10, currentValue: -5 })).toBe(0);
    expect(goalProgressPercent({ baselineValue: 0, targetValue: 10, currentValue: 25 })).toBe(100);
  });
});

describe("goals and measurements", () => {
  it("creates a goal starting at its baseline", async () => {
    const ws = await createWorkspace();
    const result = await createGoal(ws.id, { title: "Generate 50 qualified leads", metric: "leads", baselineValue: "0", targetValue: "50", deadline: "2026-12-31" });
    expect(result.ok).toBe(true);
    const goal = await db.goal.findFirstOrThrow({ where: { workspaceId: ws.id } });
    expect(goal.currentValue).toBe(0);
    expect(goal.deadline?.toISOString().slice(0, 10)).toBe("2026-12-31");
  });

  it("rejects invalid goals with field messages", async () => {
    const ws = await createWorkspace();
    const result = await createGoal(ws.id, { title: "x", metric: "", targetValue: "lots", deadline: "not a date" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.fieldErrors ?? {})).toEqual(expect.arrayContaining(["title", "metric", "targetValue", "deadline"]));
  });

  it("updates the current value and marks the goal achieved at target", async () => {
    const ws = await createWorkspace();
    await createGoal(ws.id, { title: "Generate 50 leads", metric: "leads", targetValue: 50 });
    const goal = await db.goal.findFirstOrThrow({ where: { workspaceId: ws.id } });

    await recordMeasurement(ws.id, goal.id, { value: 38, note: "After first campaign" });
    let updated = await db.goal.findUniqueOrThrow({ where: { id: goal.id } });
    expect(updated.currentValue).toBe(38);
    expect(updated.status).toBe("active");

    const result = await recordMeasurement(ws.id, goal.id, { value: 52 });
    expect(result.ok && result.value.reached).toBe(true);
    updated = await db.goal.findUniqueOrThrow({ where: { id: goal.id } });
    expect(updated.status).toBe("achieved");
    const measurement = await db.goalMeasurement.findFirstOrThrow({ where: { goalId: goal.id, value: 52 } });
    expect(measurement.source).toBe("outcome");
  });

  it("only accepts known statuses", async () => {
    const ws = await createWorkspace();
    await createGoal(ws.id, { title: "Launch new product", metric: "launches", targetValue: 1 });
    const goal = await db.goal.findFirstOrThrow({ where: { workspaceId: ws.id } });
    expect((await setGoalStatus(ws.id, goal.id, "paused")).ok).toBe(true);
    expect((await setGoalStatus(ws.id, goal.id, "exploded")).ok).toBe(false);
  });
});
