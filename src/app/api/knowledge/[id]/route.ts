import { z } from "zod";
import { getCurrentWorkspace } from "@/lib/workspace";
import { setKnowledgeStatus, verifyKnowledgeItem } from "@/brain/knowledge";

const bodySchema = z.object({ action: z.enum(["verify", "archive", "restore"]) });

// PATCH /api/knowledge/<id> with { action: "verify" | "archive" | "restore" }.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ ok: false, message: "Unknown action." }, { status: 400 });

  const workspace = await getCurrentWorkspace();
  const result =
    parsed.data.action === "verify"
      ? await verifyKnowledgeItem(workspace.id, id)
      : await setKnowledgeStatus(workspace.id, id, parsed.data.action === "archive" ? "archived" : "active");
  return Response.json(result, { status: result.ok ? 200 : 404 });
}
