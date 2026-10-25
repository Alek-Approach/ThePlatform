// What every agent on ThePlatform is made of. To add a new agent, create a file
// that exports an AgentDefinition and add it to the list in registry.ts.

export type AgentDefinition = {
  /** Permanent identifier, stored in the database. Never change it once in use. */
  id: string;
  name: string;
  icon: string;
  /** One line shown on cards. */
  tagline: string;
  /** A short paragraph explaining the agent to business owners. */
  description: string;
  /** What the agent can produce. */
  capabilities: string[];
  /** Example tasks shown to owners for inspiration. */
  exampleTasks: string[];
  /** Other agents (by id) this agent may ask for help while working. */
  canConsult: string[];
  /** Kinds of actions that must be approved by the owner before they happen. */
  actionsNeedingApproval: string[];
  /** The role instructions Claude follows when acting as this agent. */
  instructions: string;
};
