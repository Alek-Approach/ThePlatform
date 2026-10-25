"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

// Main menu. Items marked "soon" are built in later steps.
const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/profile", label: "Company profile" },
  { href: "/team", label: "AI team" },
  { href: "/tasks", label: "Tasks" },
  { label: "Approvals", soon: "Step 5" },
  { label: "Activity log", soon: "Step 5" },
  { label: "Documents", soon: "Step 6" },
];

function isCurrent(href: string, pathname: string | null) {
  if (!pathname) return false;
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function NavLinks({ pathname }: { pathname: string | null }) {
  return NAV.map((item) =>
    item.href ? (
      <Link
        key={item.label}
        href={item.href}
        className={`rounded-lg px-3 py-2 text-sm font-medium ${
          isCurrent(item.href, pathname)
            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
            : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        }`}
      >
        {item.label}
      </Link>
    ) : (
      <span
        key={item.label}
        className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-zinc-400"
        title={`Coming in ${item.soon}`}
      >
        {item.label}
        <span className="text-[10px] uppercase tracking-wide">{item.soon}</span>
      </span>
    ),
  );
}

// Reading the current address is only possible once the page is requested, so the
// highlighted menu item is filled in then; until that moment the plain menu shows.
function CurrentNavLinks() {
  return <NavLinks pathname={usePathname()} />;
}

export function Sidebar() {
  return (
    <nav className="flex flex-col gap-1 border-b border-zinc-200 bg-white p-4 md:min-h-screen md:w-60 md:border-b-0 md:border-r dark:border-zinc-800 dark:bg-zinc-900">
      <Link href="/" className="mb-4 px-3 text-lg font-bold tracking-tight">
        The<span className="text-indigo-600">Platform</span>
      </Link>
      <Suspense fallback={<NavLinks pathname={null} />}>
        <CurrentNavLinks />
      </Suspense>
    </nav>
  );
}
