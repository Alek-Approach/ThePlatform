"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// While an agent is working, re-check the page every couple of seconds.
export function AutoRefresh({ active, everyMs = 2000 }: { active: boolean; everyMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => router.refresh(), everyMs);
    return () => clearInterval(timer);
  }, [active, everyMs, router]);
  return null;
}
