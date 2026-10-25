"use client";

// Shows a date/time in the viewer's own time zone.
export function LocalTime({ iso }: { iso: string }) {
  const text = new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {text}
    </time>
  );
}
