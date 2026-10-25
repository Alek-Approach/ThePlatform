import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";
import { logActivity } from "@/core/activity";
import { type Actor, KNOWLEDGE_KINDS, SOURCES, type Source, actorName } from "./labels";
import { fromZodError, type Result } from "./result";

// Business knowledge: competitor notes, customer insights, policies, findings, lessons.
// Rules that keep AI guesses from quietly becoming facts:
//  • the founder adds knowledge as "Your input" or "Assumption";
//  • agents can only add "AI suggestion" or "Assumption";
//  • "Verified" is only ever set by the founder clicking "Mark as verified";
//  • "Measured result" only comes from goal measurements.

const FOUNDER_SOURCES: Source[] = ["user", "assumption"];
const AGENT_SOURCES: Source[] = ["ai_recommendation", "assumption"];

const kinds = Object.keys(KNOWLEDGE_KINDS) as [keyof typeof KNOWLEDGE_KINDS, ...(keyof typeof KNOWLEDGE_KINDS)[]];

const createSchema = z.object({
  kind: z.enum(kinds, { message: "Please choose a type." }),
  title: z.string().trim().min(2, "Please add a short title.").max(200, "Please keep the title under 200 characters."),
  content: z.string().trim().min(2, "Please add some details.").max(10000, "Please keep this under 10,000 characters."),
  source: z.string(),
  goalId: z.string().optional(),
  sourceTaskId: z.string().optional(),
  sourceDocumentId: z.string().optional(),
});

export type KnowledgeInput = z.input<typeof createSchema>;

export function allowedSources(actor: Actor): Source[] {
  if (actor === "founder") return FOUNDER_SOURCES;
  if (actor === "system") return [];
  return AGENT_SOURCES;
}

export async function createKnowledgeItem(workspaceId: string, input: unknown, actor: Actor): Promise<Result<{ id: string }>> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const data = parsed.data;

  if (!allowedSources(actor).includes(data.source as Source)) {
    return {
      ok: false,
      message: `Knowledge added by ${actor === "founder" ? "you" : actorName(actor)} can't be labelled "${SOURCES[data.source as Source]?.label ?? data.source}".`,
      fieldErrors: { source: "This label isn't allowed here." },
    };
  }

  // Linked records must belong to the same workspace.
  if (data.goalId && !(await db.goal.findFirst({ where: { id: data.goalId, workspaceId } }))) {
    return { ok: false, message: "That goal wasn't found." };
  }
  if (data.sourceDocumentId && !(await db.document.findFirst({ where: { id: data.sourceDocumentId, workspaceId } }))) {
    return { ok: false, message: "That document wasn't found." };
  }

  const item = await db.knowledgeItem.create({
    data: {
      workspaceId,
      kind: data.kind,
      title: data.title,
      content: data.content,
      source: data.source,
      createdBy: actorName(actor),
      goalId: data.goalId,
      sourceTaskId: data.sourceTaskId,
      sourceDocumentId: data.sourceDocumentId,
    },
  });
  await logActivity(workspaceId, {
    type: "knowledge.added",
    actor,
    message: `Added ${KNOWLEDGE_KINDS[data.kind].toLowerCase()} "${data.title}" (${SOURCES[data.source as Source].label}).`,
    entityType: "knowledge",
    entityId: item.id,
  });
  return { ok: true, value: { id: item.id } };
}

/** Founder-only: confirm a piece of knowledge as a verified business fact. */
export async function verifyKnowledgeItem(workspaceId: string, id: string): Promise<Result<{ id: string }>> {
  const item = await db.knowledgeItem.findFirst({ where: { id, workspaceId } });
  if (!item) return { ok: false, message: "That item wasn't found." };
  if (item.source === "verified") return { ok: true, value: { id } };

  await db.knowledgeItem.update({ where: { id }, data: { source: "verified", verifiedAt: new Date() } });
  await logActivity(workspaceId, {
    type: "knowledge.verified",
    actor: "founder",
    message: `Marked "${item.title}" as verified (was ${SOURCES[item.source as Source]?.label ?? item.source}).`,
    entityType: "knowledge",
    entityId: id,
    details: { previousSource: item.source },
  });
  return { ok: true, value: { id } };
}

/** Archive (hide from agents) or restore a piece of knowledge. Nothing is deleted. */
export async function setKnowledgeStatus(workspaceId: string, id: string, status: "active" | "archived"): Promise<Result<{ id: string }>> {
  const item = await db.knowledgeItem.findFirst({ where: { id, workspaceId } });
  if (!item) return { ok: false, message: "That item wasn't found." };

  await db.knowledgeItem.update({ where: { id }, data: { status } });
  await logActivity(workspaceId, {
    type: status === "archived" ? "knowledge.archived" : "knowledge.restored",
    actor: "founder",
    message: `${status === "archived" ? "Archived" : "Restored"} "${item.title}".`,
    entityType: "knowledge",
    entityId: id,
  });
  return { ok: true, value: { id } };
}

export function listKnowledge(workspaceId: string, status: "active" | "archived" = "active") {
  return db.knowledgeItem.findMany({ where: { workspaceId, status }, orderBy: { createdAt: "desc" } });
}
