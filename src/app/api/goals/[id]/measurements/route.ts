import { getCurrentWorkspace } from "@/lib/workspace";
import { recordMeasurement } from "@/brain/goals";

// POST /api/goals/<id>/measurements with { value, note? } — records a real result.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const workspace = await getCurrentWorkspace();
  const result = await recordMeasurement(workspace.id, id, body);
  return Response.json(result, { status: result.ok ? 201 : 400 });
}
