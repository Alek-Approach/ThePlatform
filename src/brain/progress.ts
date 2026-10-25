// Goal progress, calculated by code (no AI). Safe to use in the browser.

export type GoalNumbers = { baselineValue: number; targetValue: number; currentValue: number };

/** Percentage of the way from the starting value to the target, between 0 and 100. */
export function goalProgressPercent({ baselineValue, targetValue, currentValue }: GoalNumbers): number {
  const distance = targetValue - baselineValue;
  if (distance === 0) return currentValue >= targetValue ? 100 : 0;
  const percent = ((currentValue - baselineValue) / distance) * 100;
  return Math.max(0, Math.min(100, Math.round(percent)));
}

/** True once the current value has reached the target (works for "increase" and "decrease" goals). */
export function goalReached({ baselineValue, targetValue, currentValue }: GoalNumbers): boolean {
  return targetValue >= baselineValue ? currentValue >= targetValue : currentValue <= targetValue;
}
