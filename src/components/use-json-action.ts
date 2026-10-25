"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ApiResult = { ok: boolean; message?: string; fieldErrors?: Record<string, string> };

// Sends data to one of the app's save addresses, shows errors, and refreshes the
// page on success. Used by the small forms and buttons across the app.
export function useJsonAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function run(url: string, method: "POST" | "PATCH" | "PUT", body: unknown): Promise<boolean> {
    setBusy(true);
    setError(null);
    setFieldErrors({});
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as ApiResult;
      if (!result.ok) {
        setError(result.message ?? "Something went wrong. Please try again.");
        setFieldErrors(result.fieldErrors ?? {});
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError("Couldn't reach the app. Check that it's running and try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { run, busy, error, fieldErrors };
}

export const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-indigo-900";

export const buttonClass =
  "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50";

export const secondaryButtonClass =
  "rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800";
