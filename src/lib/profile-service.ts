import "server-only";
import { db } from "@/lib/db";
import { getCurrentWorkspace } from "@/lib/workspace";
import { profileSchema, type ProfileInput } from "@/lib/profile";

export type SaveProfileResult =
  | { ok: true; profile: ProfileInput }
  | { ok: false; message: string; fieldErrors?: Partial<Record<keyof ProfileInput, string>> };

// Checks the submitted profile and stores it in the current workspace.
export async function saveCompanyProfile(input: unknown): Promise<SaveProfileResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof ProfileInput, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof ProfileInput;
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors };
  }

  try {
    const workspace = await getCurrentWorkspace();
    await db.workspace.update({ where: { id: workspace.id }, data: parsed.data });
    return { ok: true, profile: parsed.data };
  } catch (error) {
    console.error("Saving company profile failed:", error);
    return { ok: false, message: "Something went wrong while saving. Please try again." };
  }
}
