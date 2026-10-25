# ThePlatform — Architecture Proposal (Phase 1 MVP)

> Written for a non-developer. Technical words are explained the first time they appear.

## 1. The big picture in one paragraph

ThePlatform is a website (a "web app"). A business owner logs in, fills in their company
profile, uploads documents, switches on AI "agents", and types tasks in plain English.
Behind the scenes, each agent is Claude (Anthropic's AI) wearing a different "hat" — a
set of instructions that makes it behave like a market researcher, a marketer, or a
strategist. All agents read from and write to a shared **Business Brain** (the company's
profile, documents, and every past result), which is how they share information and
collaborate. Anything an agent wants to *do* (not just say) goes into an **Approval
Queue** where the owner clicks Approve or Reject.

```
                ┌──────────────────────── Dashboard (web pages) ────────────────────────┐
                │ Company profile │ Documents │ Agents on/off │ Tasks │ Approvals │ Log │
                └───────────────────────────────┬───────────────────────────────────────┘
                                                │
                                   ┌────────────▼────────────┐
                                   │       Orchestrator       │  "the manager": routes a task
                                   │  (task router + handoff) │  to the right agent and lets
                                   └───┬────────┬────────┬────┘  agents ask each other for help
                                       │        │        │
                       ┌───────────────▼┐ ┌─────▼──────┐ ┌▼──────────────────┐
                       │ Market Research │ │ Marketing  │ │ Business Strategy │  ← agents = config files
                       └───────┬────────┘ └─────┬──────┘ └────────┬──────────┘
                               └────────────────┼─────────────────┘
                                                │ read/write
                          ┌─────────────────────▼─────────────────────┐
                          │ Business Brain (database, per customer)    │
                          │ profile · documents · results · approvals  │
                          │ · activity log                              │
                          └─────────────────────┬─────────────────────┘
                                                │
                                   ┌────────────▼────────────┐
                                   │   AI Provider switch    │
                                   │  MOCK (free, fake data) │
                                   │  LIVE (Claude API)      │
                                   └─────────────────────────┘
```

## 2. Recommended technology stack (and why)

| Piece | Choice | Plain-English reason |
|---|---|---|
| Programming language | **TypeScript** | One language for the whole app (pages *and* server). Catches many mistakes before they happen. |
| Web framework | **Next.js** | The most popular way to build a modern web app; front-end and back-end in one project; deploys in one click to Vercel later. |
| Look & feel | **Tailwind CSS** (+ ready-made components) | Professional design without hand-writing styling. |
| Database | **SQLite** now → **PostgreSQL** later | SQLite is a single file on your computer: zero setup. For the SaaS version we swap to a hosted Postgres (e.g. Supabase or Neon) with a one-line change. |
| Database toolkit | **Prisma** | Lets us describe the data (companies, tasks, results…) in one readable file and handles the database for us. |
| AI | **Claude via the official Anthropic SDK** (`@anthropic-ai/sdk`) | Required by you; the official library handles retries and errors properly. |
| AI model | **Claude Opus 5.5** (`claude-opus-5-5`, $4 / $20 per million tokens in/out) | Anthropic's current default model. Cost tuning (e.g. a cheaper model for simple jobs) is a business decision we can make later with real usage data. |
| Login (later, Phase 2) | Clerk or Auth.js | Not needed for the first prototype; the database is already designed for it. |
| Hosting (later) | Vercel + hosted Postgres | Cheap, simple, scales. |

Deliberately **not** used (to avoid unnecessary complexity): microservices, Kubernetes,
separate vector databases, agent frameworks like LangChain, message queues. We can add
any of these later if real usage demands it.

## 3. Key design decisions

### 3.1 Agents are configuration, not code — so adding agents 4–10 is easy
Each agent is one small file in `src/agents/` describing:
- `id`, `name`, `description`, icon
- **role instructions** (the "hat" Claude wears)
- **what it can produce** (e.g. "competitor report", "campaign plan")
- **which other agents it may consult** (collaboration)
- **which actions need approval**

The orchestrator and dashboard read a central **Agent Registry** list. Adding a Sales
Agent later = adding one file and one line to the registry. No dashboard changes.

### 3.2 How agents collaborate
1. **Shared memory (Business Brain):** every agent sees the company profile, relevant
   document excerpts, and recent results from the other agents.
2. **Consultation (handoff):** while working, an agent can request help — e.g. the
   Strategy Agent asks Market Research for "top 3 competitors". The orchestrator runs that
   sub-task, records it, and hands the answer back. (Built with Claude "tool use": we give
   the agent a `consult_agent` tool.) A depth limit prevents endless loops.
3. **Collaboration view:** every hand-off is logged, so the dashboard can draw
   "Strategy → asked → Research → answered → Strategy".

### 3.3 Approvals ("human in the loop")
Agents never act on their own. Anything that would change the outside world (publish a
post, send an email, change a price) becomes a **Proposed Action** with status
`pending → approved / rejected`. In Phase 1 "approve" just records the decision;
real-world integrations (email, social media) come later.

### 3.4 Mock mode first (saves money)
A setting `AI_MODE=mock|live` chooses the AI provider:
- **mock**: returns realistic pre-written sample results instantly, costs $0. Used for
  building and testing the dashboard.
- **live**: calls Claude. Turned on only when the plumbing works.
Both modes share the same "interface", so nothing else in the app knows the difference.

### 3.5 Keeping customer data separated (multi-tenancy)
Every record in the database carries a `workspaceId` (one workspace = one customer
business). Every database query goes through a helper that *requires* a workspace id, so
one customer can never see another's data. Uploaded files are stored in a per-workspace
folder. When we add login, a user is linked to their workspace(s).

### 3.6 Secrets (API keys)
- Your Claude API key lives in a file called `.env.local` on your machine, which is
  **never** uploaded to GitHub (it's listed in `.gitignore`).
- The key is only ever used on the server side — it is never sent to the browser.
- In production it goes into the hosting provider's encrypted "environment variables".
- Later, if customers connect their own tools (Google, Shopify…), their tokens will be
  stored encrypted in the database.

### 3.7 Errors and activity logs
- Every agent call is wrapped so a failure (AI down, rate limit, bad document) produces
  a friendly message on the dashboard instead of a crash, and the task is marked
  `failed` with the reason.
- An **Activity Log** table records who/what/when: "Task created", "Marketing Agent
  consulted Research Agent", "Action approved", "AI error: rate limited, retried".
  The dashboard has a Log page.

## 4. Data model (first version)

| Table | Holds |
|---|---|
| Workspace | one customer business (name, industry, audience, goals, …) |
| Document | uploaded file name, extracted text, owner workspace |
| AgentActivation | which agents are switched on for a workspace |
| Task | the natural-language request, assigned agent, why it was chosen, status, and the result (summary + full report) |
| ProposedAction | action an agent suggests, status pending/approved/rejected |
| ActivityLog | timestamped event history |

## 5. Folder layout (what you'll see in the project)

```
ThePlatform/
├─ docs/                  ← plain-English documentation (this file)
├─ prisma/schema.prisma   ← the data model above
├─ src/
│  ├─ app/                ← dashboard pages (Next.js)
│  ├─ agents/             ← one file per agent + registry
│  ├─ core/               ← orchestrator, business brain, approvals, logging
│  ├─ ai/                 ← AI provider switch (mock + Claude)
│  └─ mock/               ← sample data for mock mode
├─ .env.example           ← template of settings (safe to share)
└─ .env.local             ← your real secrets (never shared)
```

## 6. Build plan — small, testable steps

| Step | What we build | How you test it |
|---|---|---|
| 0 | Install tools, create empty Next.js project | See the default welcome page in your browser |
| 1 | Data model + company profile page | Fill in your company, refresh, it's still there |
| 2 | Agent registry + "My AI Team" page (activate/deactivate) | Toggle agents on/off |
| 3 | Task box + orchestrator in **mock mode** | Type a task, see a sample result appear |
| 4 | Collaboration (consult tool, mock) + collaboration view | Strategy task shows it asked Research |
| 5 | Approval queue + activity log | Approve/reject a proposed action; see it in the log |
| 6 | Document upload (text/PDF) feeding the Business Brain | Upload a doc, agents reference it |
| 7 | Switch to **live Claude** | Real AI answers; costs a few cents per task |
| 8 | Error handling polish + basic automated tests | Simulate failures, see friendly errors |

Phase 2 (later): login & billing (including cross-site request protection on the
app's save addresses under `/api`), hosted database, remaining 7 agents, integrations
(Google Analytics, email, social, CRM), scheduled/recurring automations.

## 7. What you need to install / set up

| # | Item | Why | Cost |
|---|---|---|---|
| 1 | **Node.js (LTS version)** — nodejs.org | Runs the app on your computer | Free |
| 2 | **VS Code** — code.visualstudio.com | To view files (you won't need to write code) | Free |
| 3 | **Git** — git-scm.com (Mac: already included via Xcode tools) | Saves versions of the project, syncs with GitHub | Free |
| 4 | **GitHub account** — you already have `alek-approach/theplatform` | Online backup of the project | Free |
| 5 | **Anthropic Console account** — console.anthropic.com → create API key, add ~$5–10 credit | Only needed at Step 7 (live mode) | Pay per use |

Alternative to installing 1–3: **GitHub Codespaces** (a ready-made computer in the
browser, opened from the GitHub repo page). Nothing to install; free monthly hours.
