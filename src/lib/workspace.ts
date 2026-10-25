import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { db } from "@/lib/db";

const DEFAULT_WORKSPACE_ID = "default";

// Until login is added (Phase 2) there is a single workspace. Every page and
// action gets the workspace through this function, so switching to
// "the signed-in user's workspace" later only changes this one place.
export const getCurrentWorkspace = cache(async () => {
  await connection(); // always read fresh data, never a build-time copy

  const existing = await db.workspace.findFirst({ orderBy: { createdAt: "asc" } });
  if (existing) return existing;

  // First visit: create the workspace. A fixed id means two parts of the page
  // loading at the same moment can never create two workspaces.
  try {
    return await db.workspace.upsert({
      where: { id: DEFAULT_WORKSPACE_ID },
      create: { id: DEFAULT_WORKSPACE_ID, name: "" },
      update: {},
    });
  } catch {
    return db.workspace.findUniqueOrThrow({ where: { id: DEFAULT_WORKSPACE_ID } });
  }
});
