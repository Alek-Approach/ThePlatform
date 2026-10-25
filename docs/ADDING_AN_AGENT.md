# How to add a new agent

Every agent lives in its own file in `src/agents/`. The AI team page, the dashboard and
(later) the task system all read from one list, so adding an agent does not require
changing any pages.

## The 3 steps

1. **Copy an existing agent file**, e.g. `src/agents/marketing.ts` → `src/agents/sales.ts`.
2. **Fill in the details:**
   | Field | What it means |
   |---|---|
   | `id` | Permanent short name, e.g. `"sales"`. Never change it later — it's saved in the database. |
   | `name`, `icon`, `tagline`, `description` | What owners see on the AI team page. |
   | `capabilities` | The things it can produce. |
   | `exampleTasks` | Suggestions shown to owners. |
   | `canConsult` | `id`s of agents it may ask for help. |
   | `actionsNeedingApproval` | Things it must never do without the owner clicking Approve. |
   | `instructions` | The "job description" Claude follows when acting as this agent. |
3. **Add it to the list** in `src/agents/registry.ts`.

That's it. The new agent appears on the AI team page, switched off, for every business.

## Planned agents (Phase 2)
Sales · Customer Support · Operations · Finance · Analytics · Content · (two more to decide)
