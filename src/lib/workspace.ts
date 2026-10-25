import "server-only";
import { connection } from "next/server";
import { db } from "@/lib/db";

// Until login is added (Phase 2) there is a single workspace. Every page and
// action gets the workspace through this function, so switching to
// "the signed-in user's workspace" later only changes this one place.
export async function getCurrentWorkspace() {
  await connection(); // always read fresh data, never a build-time copy

  const existing = await db.workspace.findFirst({ orderBy: { createdAt: "asc" } });
  if (existing) return existing;

  return db.workspace.create({ data: { name: "" } });
}
