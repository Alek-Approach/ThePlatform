"use client";

import { useState } from "react";
import { KNOWLEDGE_KINDS } from "@/brain/labels";
import { buttonClass, inputClass, useJsonAction } from "@/components/use-json-action";

export function KnowledgeForm() {
  const { run, busy, error, fieldErrors } = useJsonAction();
  const [formKey, setFormKey] = useState(0);
  const [saved, setSaved] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    const data = Object.fromEntries(new FormData(event.currentTarget));
    if (await run("/api/knowledge", "POST", data)) {
      setFormKey((k) => k + 1); // clear the form
      setSaved(true);
    }
  }

  return (
    <form key={formKey} onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-medium">
        Type
        <select name="kind" defaultValue="competitor" className={inputClass}>
          {Object.entries(KNOWLEDGE_KINDS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {fieldErrors.kind && <span className="mt-1 block text-xs text-red-600">{fieldErrors.kind}</span>}
      </label>
      <label className="block text-sm font-medium">
        How sure are you?
        <select name="source" defaultValue="user" className={inputClass}>
          <option value="user">I know this (your input)</option>
          <option value="assumption">It&apos;s my best guess (assumption)</option>
        </select>
      </label>
      <label className="block text-sm font-medium sm:col-span-2">
        Title
        <input name="title" placeholder="e.g. Corner Café prices" className={inputClass} />
        {fieldErrors.title && <span className="mt-1 block text-xs text-red-600">{fieldErrors.title}</span>}
      </label>
      <label className="block text-sm font-medium sm:col-span-2">
        Details
        <textarea name="content" rows={3} placeholder="What do you know?" className={inputClass} />
        {fieldErrors.content && <span className="mt-1 block text-xs text-red-600">{fieldErrors.content}</span>}
      </label>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={busy} className={buttonClass}>
          {busy ? "Saving…" : "Add to Business Brain"}
        </button>
        {saved && <span className="text-sm text-green-700">✓ Added.</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  );
}
