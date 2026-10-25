import { getCurrentWorkspace } from "@/lib/workspace";
import { createGoal } from "@/brain/goals";

// POST /api/goals — creates a measurable business goal.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const workspace = await getCurrentWorkspace();
  const result = await createGoal(workspace.id, body);
  return Response.json(result, { status: result.ok ? 201 : 400 });
}
