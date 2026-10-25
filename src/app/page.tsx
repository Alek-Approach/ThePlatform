const agents = [
  { name: "Market Research Agent", role: "Studies your market, customers and competitors." },
  { name: "Marketing Agent", role: "Plans campaigns, content and messaging." },
  { name: "Business Strategy Agent", role: "Turns insights into goals, plans and priorities." },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-widest text-indigo-600">ThePlatform</p>
        <h1 className="text-4xl font-semibold tracking-tight">Your AI business team</h1>
        <p className="max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
          Step 0 is working. Next we&apos;ll add your company profile, then bring these agents to life.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {agents.map((agent) => (
          <div
            key={agent.name}
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <h2 className="font-semibold">{agent.name}</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{agent.role}</p>
            <span className="mt-4 inline-block rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              Coming in Step 2
            </span>
          </div>
        ))}
      </section>
    </main>
  );
}
