const STYLES: Record<string, { label: string; className: string }> = {
  queued: { label: "Queued", className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
  running: { label: "Working…", className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse" },
  completed: { label: "Done", className: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" },
  failed: { label: "Failed", className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" },
};

export function TaskStatus({ status }: { status: string }) {
  const style = STYLES[status] ?? STYLES.queued;
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${style.className}`}>{style.label}</span>;
}

export const isPending = (status: string) => status === "queued" || status === "running";
