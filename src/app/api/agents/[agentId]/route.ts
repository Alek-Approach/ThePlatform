import { z } from "zod";
import { getCurrentWorkspace } from "@/lib/workspace";
import { setAgentActive } from "@/lib/agents-service";

const bodySchema = z.object({ active: z.boolean() });

// PUT /api/agents/<agentId> with { "active": true | false } — switches an agent on or off.
export async function PUT(request: Request, { params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await params;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ ok: false, message: "Expected { active: true | false }." }, { status: 400 });
  }

  const workspace = await getCurrentWorkspace();
  const result = await setAgentActive(workspace.id, agentId, parsed.data.active);
  const status = result.ok ? 200 : result.message === "That agent doesn't exist." ? 404 : 500;
  return Response.json(result, { status });
}
