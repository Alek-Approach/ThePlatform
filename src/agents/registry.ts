import type { AgentDefinition } from "./types";
import { marketResearchAgent } from "./market-research";
import { marketingAgent } from "./marketing";
import { businessStrategyAgent } from "./business-strategy";

// The list of all agents on ThePlatform. Adding an agent = add it here.
export const AGENTS: AgentDefinition[] = [marketResearchAgent, marketingAgent, businessStrategyAgent];

export function getAgent(id: string): AgentDefinition | undefined {
  return AGENTS.find((agent) => agent.id === id);
}

export type { AgentDefinition };
