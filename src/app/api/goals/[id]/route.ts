import { z } from "zod";
import { getCurrentWorkspace } from "@/lib/workspace";
import { setGoalStatus } from "@/brain/goals";

const bodySchema = z.object({ status: z.string() });

// PATCH /api/goals/<id> with { status } — e.g. pause, archive or mark as missed.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ ok: false, message: "Expected { status }." }, { status: 400 });

  const workspace = await getCurrentWorkspace();
  const result = await setGoalStatus(workspace.id, id, parsed.data.status);
  return Response.json(result, { status: result.ok ? 200 : 400 });
}
