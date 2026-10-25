import { SOURCES, type Source } from "@/brain/labels";

const COLORS: Record<Source, string> = {
  verified: "bg-green-100 text-green-800 ring-green-200 dark:bg-green-950 dark:text-green-300 dark:ring-green-900",
  user: "bg-sky-100 text-sky-800 ring-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-900",
  ai_recommendation: "bg-violet-100 text-violet-800 ring-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-900",
  assumption: "bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900",
  outcome: "bg-teal-100 text-teal-800 ring-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:ring-teal-900",
};

const ICONS: Record<Source, string> = { verified: "✓", user: "✎", ai_recommendation: "✦", assumption: "?", outcome: "▲" };

// Shows where a piece of information came from.
export function SourceBadge({ source }: { source: string }) {
  const known = source in SOURCES ? (source as Source) : "assumption";
  return (
    <span
      title={SOURCES[known].description}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${COLORS[known]}`}
    >
      <span aria-hidden>{ICONS[known]}</span>
      {SOURCES[known].label}
    </span>
  );
}

export function SourceLegend() {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-zinc-600 dark:text-zinc-400">
      {(Object.keys(SOURCES) as Source[]).map((source) => (
        <span key={source} className="flex items-center gap-2">
          <SourceBadge source={source} /> {SOURCES[source].description}
        </span>
      ))}
    </div>
  );
}
