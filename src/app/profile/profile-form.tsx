"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { PROFILE_FIELD_NAMES, PROFILE_SECTIONS, type ProfileInput } from "@/lib/profile";
import type { SaveProfileResult } from "@/lib/profile-service";

type SaveProfileState = {
  status: "idle" | "saved" | "error";
  message?: string;
  fieldErrors?: Partial<Record<keyof ProfileInput, string>>;
  values?: ProfileInput;
  savedAt?: number;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-indigo-900";

export function ProfileForm({ initial }: { initial: ProfileInput }) {
  const router = useRouter();

  // Sends the form to the app's save address (/api/profile) and reports back.
  async function saveProfile(_prev: SaveProfileState, formData: FormData): Promise<SaveProfileState> {
    const values = Object.fromEntries(
      PROFILE_FIELD_NAMES.map((key) => [key, String(formData.get(key) ?? "")]),
    ) as ProfileInput;

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = (await response.json()) as SaveProfileResult;
      if (!result.ok) {
        return { status: "error", message: result.message, fieldErrors: result.fieldErrors, values };
      }
      router.refresh(); // update the dashboard and menu with the new details
      return { status: "saved", message: "Profile saved.", values: result.profile, savedAt: Date.now() };
    } catch {
      return { status: "error", message: "Couldn't reach the app to save. Check that it's running and try again.", values };
    }
  }

  const [state, formAction, pending] = useActionState<SaveProfileState, FormData>(saveProfile, {
    status: "idle",
    values: initial,
  });
  const values = state.values ?? initial;

  return (
    // After each save the form is redrawn from the saved values (React clears
    // forms after submitting, which would otherwise blank the dropdowns).
    <form key={state.savedAt ?? 0} action={formAction} className="flex flex-col gap-8">
      {PROFILE_SECTIONS.map((section) => (
        <fieldset
          key={section.title}
          className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <legend className="sr-only">{section.title}</legend>
          <h2 className="text-lg font-semibold">{section.title}</h2>
          <p className="text-sm text-zinc-500">{section.description}</p>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {section.fields.map((field) => {
              const error = state.fieldErrors?.[field.name];
              const wide = field.kind === "textarea";
              return (
                <label key={field.name} className={`block text-sm font-medium ${wide ? "sm:col-span-2" : ""}`}>
                  {field.label}
                  {field.required && <span className="text-red-600"> *</span>}

                  {field.kind === "select" ? (
                    <select name={field.name} defaultValue={values[field.name]} className={inputClass}>
                      <option value="">Choose…</option>
                      {field.options?.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  ) : field.kind === "textarea" ? (
                    <textarea
                      name={field.name}
                      rows={3}
                      defaultValue={values[field.name]}
                      placeholder={field.placeholder}
                      className={inputClass}
                    />
                  ) : (
                    <input
                      name={field.name}
                      defaultValue={values[field.name]}
                      placeholder={field.placeholder}
                      className={inputClass}
                    />
                  )}

                  {field.help && <span className="mt-1 block text-xs font-normal text-zinc-500">{field.help}</span>}
                  {error && <span className="mt-1 block text-xs font-normal text-red-600">{error}</span>}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div className="sticky bottom-0 flex items-center gap-4 border-t border-zinc-200 bg-zinc-50/90 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save profile"}
        </button>
        {state.message && (
          <p role="status" className={`text-sm ${state.status === "saved" ? "text-green-700" : "text-red-600"}`}>
            {state.status === "saved" ? "✓ " : ""}
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
