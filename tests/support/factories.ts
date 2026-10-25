import { db } from "@/lib/db";

// Creates a separate, empty business for a test.
export async function createWorkspace(name = "Test Co") {
  return db.workspace.create({ data: { name } });
}
