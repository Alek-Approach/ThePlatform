import { getCurrentWorkspace } from "@/lib/workspace";
import { createKnowledgeItem } from "@/brain/knowledge";

// POST /api/knowledge — the founder adds a piece of business knowledge.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const workspace = await getCurrentWorkspace();
  const result = await createKnowledgeItem(workspace.id, body, "founder");
  return Response.json(result, { status: result.ok ? 201 : 400 });
}
