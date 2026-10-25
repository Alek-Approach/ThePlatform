import type { z } from "zod";

// The shape every Business Brain operation returns, so pages can show clear messages.
export type Result<T> = { ok: true; value: T } | { ok: false; message: string; fieldErrors?: Record<string, string> };

export function fromZodError(error: z.ZodError): { ok: false; message: string; fieldErrors: Record<string, string> } {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return { ok: false, message: "Please fix the highlighted fields.", fieldErrors };
}
