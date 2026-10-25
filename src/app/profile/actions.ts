"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentWorkspace } from "@/lib/workspace";
import { PROFILE_FIELD_NAMES, profileSchema, type ProfileInput } from "@/lib/profile";

export type SaveProfileState = {
  status: "idle" | "saved" | "error";
  message?: string;
  fieldErrors?: Partial<Record<keyof ProfileInput, string>>;
  values?: ProfileInput;
  savedAt?: number;
};

export async function saveProfile(_prev: SaveProfileState, formData: FormData): Promise<SaveProfileState> {
  const raw = Object.fromEntries(
    PROFILE_FIELD_NAMES.map((key) => [key, String(formData.get(key) ?? "")]),
  ) as ProfileInput;

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: SaveProfileState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof ProfileInput;
      fieldErrors[key] ??= issue.message;
    }
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors, values: raw };
  }

  try {
    const workspace = await getCurrentWorkspace();
    await db.workspace.update({ where: { id: workspace.id }, data: parsed.data });
  } catch (error) {
    console.error("Saving company profile failed:", error);
    return { status: "error", message: "Something went wrong while saving. Please try again.", values: raw };
  }

  revalidatePath("/", "layout");
  return { status: "saved", message: "Profile saved.", values: parsed.data, savedAt: Date.now() };
}
