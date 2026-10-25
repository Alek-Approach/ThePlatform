import "server-only";
import { type AIProvider, FriendlyError } from "./types";
import { mockProvider } from "./mock";

// Chooses the AI provider from the AI_MODE setting (see .env.example).
export function getAIProvider(): AIProvider {
  const mode = (process.env.AI_MODE ?? "mock").trim().toLowerCase();
  if (mode === "mock") return mockProvider;
  if (mode === "live") {
    throw new FriendlyError("Live AI mode is not connected yet (coming in Step 7). Set AI_MODE=mock for now.");
  }
  throw new FriendlyError(`Unknown AI_MODE "${mode}". Use "mock" or "live".`);
}

export { FriendlyError };
export type { AIProvider };
