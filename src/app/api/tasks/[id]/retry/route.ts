import { after } from "next/server";
import { getCurrentWorkspace } from "@/lib/workspace";
import { retryTask } from "@/lib/tasks-service";
import { runTask } from "@/core/orchestrator";

// POST /api/tasks/<id>/retry — runs a task that didn't finish again.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workspace = await getCurrentWorkspace();
  const result = await retryTask(workspace.id, id);
  if (!result.ok) return Response.json(result, { status: 400 });

  after(() => runTask(id));
  return Response.json(result);
}
