import type { AgentDefinition } from "@/agents/types";
import type { ProfileInput } from "@/lib/profile";

// The single doorway between ThePlatform and an AI. The mock provider (free sample
// answers) and the Claude provider (real AI, Step 7) both fit this shape, so the
// rest of the app never needs to know which one is in use.

export type AgentRunInput = {
  agent: AgentDefinition;
  profile: ProfileInput;
  task: string;
};

export type AgentRunOutput = {
  /** One or two sentences, shown in task lists. */
  summary: string;
  /** The full result as formatted text (Markdown). */
  output: string;
};

export type RouteInput = {
  task: string;
  profile: ProfileInput;
  /** Only the agents the owner has switched on. */
  agents: AgentDefinition[];
};

export type RouteDecision = { agentId: string; reason: string };

export interface AIProvider {
  readonly mode: "mock" | "live";
  /** Picks the best agent for a task. */
  routeTask(input: RouteInput): Promise<RouteDecision>;
  /** Has an agent carry out a task. */
  runAgent(input: AgentRunInput): Promise<AgentRunOutput>;
}

/** An error whose message is safe and helpful to show to the business owner. */
export class FriendlyError extends Error {}
