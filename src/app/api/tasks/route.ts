import { after } from "next/server";
import { getCurrentWorkspace } from "@/lib/workspace";
import { runTask, submitTask } from "@/core/orchestrator";

// POST /api/tasks with { prompt, agentId? } — creates a task and starts it in the background.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const workspace = await getCurrentWorkspace();

  const result = await submitTask(workspace.id, body);
  if (!result.ok) return Response.json(result, { status: 400 });

  // Answer the browser straight away; the agent works after the response is sent.
  after(() => runTask(result.taskId));
  return Response.json(result, { status: 201 });
}
