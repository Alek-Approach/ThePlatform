// Plain-English labels for the Business Brain. Safe to use in the browser.

export const SOURCES = {
  verified: { label: "Verified", description: "Confirmed by you as a business fact." },
  user: { label: "Your input", description: "Information you typed or uploaded." },
  ai_recommendation: { label: "AI suggestion", description: "Advice or a plan produced by an agent." },
  assumption: { label: "Assumption", description: "An estimate or guess that hasn't been confirmed." },
  outcome: { label: "Measured result", description: "A real result you recorded." },
} as const;

export type Source = keyof typeof SOURCES;

/** Who did something: the founder, the system itself, or an agent (by its id). */
export type Actor = "founder" | "system" | { agentId: string };

export const actorName = (actor: Actor) => (typeof actor === "string" ? actor : actor.agentId);

export const KNOWLEDGE_KINDS = {
  competitor: "Competitor",
  customer_insight: "Customer insight",
  product: "Product or service",
  policy: "Business policy",
  research_finding: "Research finding",
  lesson: "Lesson learned",
  other: "Other",
} as const;

export type KnowledgeKind = keyof typeof KNOWLEDGE_KINDS;

export const GOAL_STATUSES = {
  active: "Active",
  achieved: "Achieved",
  missed: "Missed",
  paused: "Paused",
  archived: "Archived",
} as const;

export type GoalStatus = keyof typeof GOAL_STATUSES;
