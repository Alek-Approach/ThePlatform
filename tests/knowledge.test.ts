import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createKnowledgeItem, listKnowledge, setKnowledgeStatus, verifyKnowledgeItem } from "@/brain/knowledge";
import { createWorkspace } from "./support/factories";

const note = { kind: "competitor", title: "Corner Café", content: "Sells bread at $4 a loaf." };

describe("knowledge source rules", () => {
  it("lets the founder add knowledge as their input or an assumption", async () => {
    const ws = await createWorkspace();
    expect((await createKnowledgeItem(ws.id, { ...note, source: "user" }, "founder")).ok).toBe(true);
    expect((await createKnowledgeItem(ws.id, { ...note, source: "assumption" }, "founder")).ok).toBe(true);
  });

  it("never lets anything be created directly as verified or as a measured result", async () => {
    const ws = await createWorkspace();
    for (const source of ["verified", "outcome"]) {
      expect((await createKnowledgeItem(ws.id, { ...note, source }, "founder")).ok).toBe(false);
      expect((await createKnowledgeItem(ws.id, { ...note, source }, { agentId: "market-research" })).ok).toBe(false);
    }
  });

  it("limits agents to AI suggestions and assumptions", async () => {
    const ws = await createWorkspace();
    const agent = { agentId: "market-research" };
    expect((await createKnowledgeItem(ws.id, { ...note, source: "ai_recommendation" }, agent)).ok).toBe(true);
    expect((await createKnowledgeItem(ws.id, { ...note, source: "assumption" }, agent)).ok).toBe(true);
    expect((await createKnowledgeItem(ws.id, { ...note, source: "user" }, agent)).ok).toBe(false);
  });

  it("records who created an item", async () => {
    const ws = await createWorkspace();
    const result = await createKnowledgeItem(ws.id, { ...note, source: "ai_recommendation" }, { agentId: "marketing" });
    const item = await db.knowledgeItem.findUniqueOrThrow({ where: { id: (result as { value: { id: string } }).value.id } });
    expect(item.createdBy).toBe("marketing");
  });

  it("turns an item into verified only through the founder's verify action, and logs it", async () => {
    const ws = await createWorkspace();
    const created = await createKnowledgeItem(ws.id, { ...note, source: "assumption" }, "founder");
    const id = (created as { value: { id: string } }).value.id;
    await verifyKnowledgeItem(ws.id, id);
    const item = await db.knowledgeItem.findUniqueOrThrow({ where: { id } });
    expect(item.source).toBe("verified");
    expect(item.verifiedAt).not.toBeNull();
    const event = await db.activityEvent.findFirst({ where: { workspaceId: ws.id, type: "knowledge.verified" } });
    expect(event?.message).toContain("was Assumption");
  });

  it("validates input with friendly messages", async () => {
    const ws = await createWorkspace();
    const result = await createKnowledgeItem(ws.id, { kind: "nonsense", title: "", content: "", source: "user" }, "founder");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.fieldErrors ?? {})).toEqual(expect.arrayContaining(["kind", "title", "content"]));
  });

  it("archives without deleting, and can restore", async () => {
    const ws = await createWorkspace();
    const id = ((await createKnowledgeItem(ws.id, { ...note, source: "user" }, "founder")) as { value: { id: string } }).value.id;
    await setKnowledgeStatus(ws.id, id, "archived");
    expect(await listKnowledge(ws.id)).toHaveLength(0);
    expect(await listKnowledge(ws.id, "archived")).toHaveLength(1);
    await setKnowledgeStatus(ws.id, id, "active");
    expect(await listKnowledge(ws.id)).toHaveLength(1);
  });
});
