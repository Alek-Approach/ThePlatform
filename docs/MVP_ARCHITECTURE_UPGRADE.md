# ThePlatform — MVP Architecture Upgrade

*Status: design approved. **Phase A complete** (see §11). Phases B–F not started.*

---

## 1. Summary in plain English

ThePlatform today is a **solid, working skeleton**: a company profile, three switchable
agents, and a task box where one agent at a time answers using free sample answers.

The upgrade turns it into a **business operating system** in four moves:

1. **A real Business Brain:** goals, knowledge, decisions and results, each labelled by
   *where it came from* (verified fact, your input, AI suggestion, assumption, or measured
   result), so AI guesses can never quietly become "facts".
2. **Workflows instead of single questions:** pre-designed multi-agent recipes (Idea
   Validation, Marketing Strategy, Product Launch) that pass checked results from one
   agent to the next and produce one combined deliverable.
3. **A quality gate and approvals:** every important output is checked by rules first
   (free), by an AI reviewer only when the risk justifies it, and anything consequential
   waits for your Approve / Reject / Revise.
4. **Goals and outcomes:** you set measurable goals, record real results, and the
   platform shows progress and nudges you when you fall behind, without running up AI costs.

The guiding rule: **predictable code decides the order of work; AI does the thinking
inside each step.** That keeps the system reliable, affordable and explainable.

---

## 2. Current architecture assessment (verified against the code)

I read every source file, the database schema and all migrations. The documentation in
`docs/ARCHITECTURE.md` describes the *plan*; several parts of it are **not built yet**.

### 2.1 What exists today

| Area | Status | Where |
|---|---|---|
| Company profile (14 fields), validated, saved per workspace | ✅ Working | `Workspace` table, `src/lib/profile*.ts`, `/profile` |
| Agent registry: 3 agents as config files with role instructions, capabilities, collaborators, approval rules | ✅ Working | `src/agents/*` |
| Per-workspace agent on/off switches | ✅ Working | `AgentActivation` table, `/team` |
| Tasks: plain-English task → agent (keyword routing or owner's choice) → background run → stored result | ✅ Working | `src/core/orchestrator.ts`, `Task` table, `/tasks` |
| AI provider switch (mock / live) | ⚠️ Half-built | `src/ai/*`. Mock works; **live throws "not connected yet"** |
| Mock sample answers that use the profile | ✅ Working | `src/ai/mock.ts` |
| Friendly error handling for tasks and forms | ✅ Working | orchestrator, API routes |
| Workspace isolation | ⚠️ By convention | Every query passes `workspaceId`, but there is no login, a single default workspace, and no tests proving isolation |
| Codespaces setup, auto database updates on start | ✅ Working | `.devcontainer`, `package.json` `predev` |

### 2.2 Planned in the original proposal but **not built**

| Item | Reality |
|---|---|
| "Business Brain" (documents, past results as shared memory) | **Not built.** Agents receive only the 14 profile fields. |
| Document upload | Not built |
| Agent collaboration / `consult_agent` hand-offs | Not built. Each task uses exactly one agent. |
| Approval queue | Not built. Mock answers *mention* "Proposed actions" as text only. |
| Activity log | Not built. Only server console messages. |
| Live Claude connection | Not built. The Anthropic SDK is not installed yet. |
| Automated tests | **None exist.** I have been testing with throwaway browser scripts. |

### 2.3 Problems found during the audit

| # | Issue | Impact | Fix (phase) |
|---|---|---|---|
| 1 | If the app restarts while an agent is working, that task stays "Working…" forever (background work is lost and nothing resumes it). | Confusing stuck tasks; matters more with long multi-agent workflows. | Step-by-step, resumable runs plus "stale run" detection (B) |
| 2 | Agent results are free text. Nothing machine-readable says which statements are facts vs. assumptions, or which actions need approval. | Blocks the quality gate, approvals and provenance. | Structured agent output (B) |
| 3 | No automated tests. | Regressions only caught by hand. | Add a test runner in Phase A and grow it every phase |
| 4 | Workspace isolation not enforced centrally. | Risk grows with every new table. | Data-access rule + isolation tests (A) |
| 5 | Save addresses (`/api/...`) have no request protection. | Acceptable without login; must be fixed before real customers. | With login (post-MVP, already noted) |

---

## 3. Gap analysis against the new specification

Legend: ✅ exists · 🟡 partial, extend it · 🆕 new · ⏸ postpone

| Spec section | Verdict | Notes |
|---|---|---|
| 3A Business Identity | 🟡 | Profile has most fields; add *value proposition* and *competitive positioning*. |
| 3B Business Knowledge | 🆕 | Documents + knowledge items with provenance labels. |
| 3C Business Goals | 🆕 | Measurable goals with metric, target, current value, deadline. |
| 3D Decision Memory | 🆕 | Comes "for free" from approvals: every approve/reject becomes a decision record. |
| 3E Performance Memory | 🆕 | Goal measurements + workflow outcomes + lessons learned. |
| Provenance labels (fact / user / AI / assumption / outcome) | 🆕 | One `source` field on every knowledge item, claim and measurement. |
| Relevant-context retrieval | 🆕 | See §4.2; no vector database needed for MVP. |
| 4 Goal-oriented orchestrator | 🟡 | Extend the existing orchestrator; don't replace it. |
| 5 Quality gate | 🆕 | Rules first; AI reviewer only for higher-risk steps in live mode. |
| 6 Reusable workflows (3) | 🆕 | Config files, like agents. |
| 7 Outcome intelligence | 🆕 | Manual entry, calculated progress, factual summaries. |
| 8 Proactive monitoring | 🆕 | **Simplified**: checks run on app visit, not a separate scheduler (see §4.7). |
| 9 Agent registry expansion | 🟡 | Add version, inputs, context needs, permissions, output schema, quality rules, limits. |
| 10 Human control / approvals | 🆕 | Approve, reject, request revision; reasons, evidence, goal, consequences. |
| 11 Dashboard redesign | 🟡 | Restructure navigation (§4.10). |
| 12 Observability, versioning, provenance, recovery, tests | 🆕 | Activity log + AI usage records + version stamps + resumable runs + test suite. |
| 13 Feedback (useful / not useful / needs improvement) | 🆕 | Simple, stored per result, fed back into future context. |
| Live Claude | 🆕 | Not listed in phases A–F, but required for real value. Proposed inside Phase C. |
| Agent marketplace, external integrations, analytics connectors, model training, autonomous always-on agents | ⏸ | Explicitly out of MVP scope (agrees with spec). |

---

## 4. Recommended architecture

### 4.1 The big picture

```
 Founder ──► Overview / Work / Goals / Approvals (dashboard)
               │
               ▼
        ┌──────────────┐     picks a recipe      ┌───────────────────────┐
        │ Orchestrator │ ◄────────────────────── │ Workflow templates     │ (config files)
        │  (manager)   │                          │ idea-validation, …     │
        └──────┬───────┘                          └───────────────────────┘
   runs steps  │ in order, one at a time, saving progress after each
               ▼
   ┌──────────────────┐   gets relevant   ┌──────────────────────────────┐
   │ Agent step        │ ◄──── context ─── │ Business Brain                │
   │ (Research/Strat/  │                   │ identity · knowledge · goals  │
   │  Marketing)       │ ──── saves ─────► │ decisions · outcomes · feedback│
   └────────┬─────────┘   claims+sources  └──────────────────────────────┘
            ▼
   ┌──────────────────┐  pass ─► next step / final deliverable
   │ Quality gate      │  fail ─► one revision ─► still failing ─► flag to founder
   └────────┬─────────┘
            ▼
   ┌──────────────────┐   approve / reject / revise  ─►  Decision memory
   │ Approval queue    │
   └──────────────────┘
   Everything above writes to the Activity log (+ AI usage & cost records).
```

### 4.2 Business Brain (Business Intelligence Layer)

**Design choice: a few general tables, not one table per idea.** Fewer tables means fewer
migrations, simpler code, and easier addition of future agents.

| Category | Storage | Notes |
|---|---|---|
| A. Identity | Existing `Workspace` profile + 2 new fields | Already edited on the profile page. |
| B. Knowledge | `Document` (uploaded file + extracted text) and `KnowledgeItem` (one fact/finding/policy/competitor note) | `KnowledgeItem` has a `kind` (competitor, customer insight, policy, research finding…) and a **`source`** label. |
| C. Goals | `Goal` + `GoalMeasurement` | Metric, baseline, target, current value (latest measurement), deadline, status. |
| D. Decisions | `Decision` | Created when you approve/reject/revise. Can be marked "no longer applies" (superseded) so old choices don't become permanent rules. |
| E. Performance | `GoalMeasurement` + `WorkflowRun.outcome` + `Lesson` notes (a `KnowledgeItem` kind) | Results you record, linked to goals and workflows. |
| Feedback | `Feedback` | Useful / Not useful / Needs improvement + optional note, on any result. |

**Provenance (where information came from).** Every knowledge item, agent claim and
measurement carries one of:

| Label | Meaning | Who can create it |
|---|---|---|
| `verified` | Confirmed business fact | **Only the founder**, by explicitly marking something verified |
| `user` | Information the founder typed or uploaded | Founder |
| `ai_recommendation` | Advice or a plan produced by an agent | Agents |
| `assumption` | An estimate or guess, from an agent or the founder | Either |
| `outcome` | A measured result the founder recorded | Founder |

The code enforces the rule: agents can only write `ai_recommendation` or `assumption`.
Promotion to `verified` is a deliberate founder click, recorded in the activity log.

**Relevant-context retrieval (no vector database).** Before each agent step, a
"context builder" assembles a compact briefing:
1. Always: profile essentials + the goal this work serves.
2. Then items ranked by: relevance to the step (keyword overlap and matching `kind`s the
   agent declares it needs), linkage to the same goal or workflow, verified/outcome first,
   recency, and decisions that are still active.
3. Cut off at a fixed size budget (for example ~6,000 words), with each item tagged with
   its source label and ID so outputs can cite it.

*Why no vector database:* a small business will have hundreds, not millions, of items.
Simple scoring is fast, free, explainable and testable. If it is ever needed, PostgreSQL
can add semantic search (pgvector) later without changing the rest of the design.

**Uploaded documents are treated as data, never as instructions.** They are wrapped and
labelled in prompts so a malicious or odd document can't redirect an agent.

### 4.3 Expanded agent registry

The existing "one config file per agent" approach stays. New fields:

| Field | Purpose |
|---|---|
| `version` | Stamped on every result for traceability. |
| `role` | Business role (research, strategy, marketing, later sales/finance…). |
| `capabilities` (as IDs, e.g. `competitor_analysis`) | Workflows and the planner pick agents by capability, **not by name**, so a future "Sales Agent" just declares what it can do. |
| `requiredInputs`, `contextNeeds` | Which Brain categories/kinds the context builder fetches. |
| `tools` | MVP: none or "consult another agent". Future: web search, CRM… |
| `permissions` | Which **action types** it may *propose* (e.g. `publish_content`). Proposing ≠ doing: no agent can ever execute these. |
| `outputSchema` | The structured shape its results must follow (see 4.4). |
| `qualityRules` | Extra rule checks for this agent. |
| `limits` | Max output size, max consultations, timeout, cost ceiling per step. |

### 4.4 Structured agent output (the key enabler)

Today results are free text. In the upgrade every agent returns **structured data plus a
readable report**:

```
summary            – 1–2 sentences
report             – the formatted deliverable (what you read)
claims[]           – important statements, each labelled fact / assumption / estimate,
                     with the IDs of the Brain items or documents it relies on (if any)
proposedActions[]  – things that need your approval: type, description, reasoning,
                     expected consequences, estimated cost, risk level, related goal
risks[]            – financial / legal / reputational / operational flags
openQuestions[]    – what the agent couldn't determine
```

With live Claude this uses the API's **structured outputs** feature, so the shape is
guaranteed. Mock mode produces the same shape. This one change powers provenance, the
quality gate, approvals and the "verified vs. assumed" display.

### 4.5 Orchestrator: goal-oriented, deterministic

**Recommendation: AI chooses and fills in a plan; code runs the plan.**

1. **Interpret.** The founder writes an objective. The planner (AI in live mode, keyword
   rules in mock mode) returns a structured choice: which **workflow template** fits,
   the filled-in inputs, and a draft measurable goal for the founder to confirm.
   If nothing fits, it falls back to a single-agent task (today's behaviour).
   *The AI cannot invent arbitrary multi-step plans in the MVP*; it can only pick from
   tested templates. This is what makes it reliable.
2. **Run.** A `WorkflowRun` is created with one `Task` per template step and the
   step dependencies recorded. The engine runs **one step at a time**, saving after each:
   - wait until dependencies are complete → build context (including dependency outputs)
     → run agent → quality gate → save → next.
3. **Hand-offs** are explicit: step outputs become labelled inputs for later steps, and
   the screen shows "Research → Strategy → Marketing".
4. **Consolidate.** A final step merges the step results into one deliverable with a
   combined "assumptions & risks" section and all proposed actions.
5. **Ad-hoc collaboration** (an agent asking another agent mid-step) is limited to
   *one level deep, max 2 consultations per step* in the MVP.

**Safeguards (all configurable, with defaults):**

| Safeguard | Default |
|---|---|
| Max workflow steps | 8 |
| Max consultation depth / count per step | 1 / 2 |
| Max time per step / per run | 3 min / 20 min |
| Max AI spend per run / per workspace per day | $2 / $10 (live mode only) |
| Retries per step (temporary errors) | 2 |
| Revisions per step (quality failures) | 1 |
| Circular dependencies | Rejected when a workflow template is loaded, and covered by tests |
| Cancellation | "Stop" button; the engine checks between steps |
| Failure | Clear failed state; the **Retry** button resumes from the failed step and keeps completed steps |
| Stale runs | A run with no progress past the time limit is marked "interrupted" and can be resumed (fixes audit issue #1) |

### 4.6 Quality gate

A reusable checker run after every important step:

| Check | How | Cost |
|---|---|---|
| Structure | Output matches its schema | Free |
| Completeness | Required sections and required claims present (from the workflow step's definition) | Free |
| Business consistency | Compares numbers and constraints in proposed actions with the profile and goals (e.g. budget above the stated limit, contradicting an active decision) | Free |
| Evidence | Claims marked "fact" must cite a Brain item, document or dependency; otherwise they are downgraded to "assumption" and flagged | Free |
| Risk | Proposed actions with financial / legal / reputational / operational types or high cost are flagged and forced into approval | Free |
| Logic | **AI reviewer**, only when the step's risk level is "high" *and* live mode is on. It looks for contradictions and unsupported conclusions and reports *possible* issues; it doesn't claim to verify facts. | One extra AI call |

On failure: identify the problem → one automatic revision with the problems listed →
re-check → if still failing, the result is delivered with a visible
"⚠ needs your review" flag and the issues listed. All checks are logged.
Check strictness is set per workflow step (`riskLevel: low | medium | high`).

### 4.7 Proactive monitoring (simplified on purpose)

**Proposal: "check on visit" instead of a scheduler.** When the founder opens the app (at
most once every few hours per workspace), a fast, rule-based check compares each goal's
progress with the expected pace toward its deadline. If a goal is behind, it creates a
recommendation such as *"2 of 5 planned posts are ready. Ask the Marketing Agent to
prepare 3 more?"* with an Approve button that starts the task.

- **No AI cost:** the check and the message are template-based. AI only runs if you approve.
- **No duplicates:** one open recommendation per goal per period.
- **Trade-off:** checks only happen when someone opens the app. For a founder who uses it
  regularly that is fine. In production, a free scheduled job (e.g. a daily cron on the
  hosting provider) can call **the same function** with no redesign.

### 4.8 Approvals and human control

`ProposedAction` records come from agents' structured output, never from free text.

- Buttons: **Approve · Reject · Request revision** (with an optional note).
- The card shows the reasoning, evidence (linked claims/documents), related goal,
  expected consequences, cost and risk.
- Every decision creates a `Decision` record (Decision Memory) and an activity-log entry.
- **Enforced restriction:** there is no code path that performs external actions in the
  MVP. A future "action executor" will refuse any action without a matching approved
  record, and permission lists live in the agent config. The rule stays enforceable once
  integrations arrive.

### 4.9 Outcome intelligence and feedback

- Goals have metric, baseline, target, deadline. You add measurements over time.
- Progress = (current − baseline) ÷ (target − baseline), plus "on pace / behind / ahead"
  based on time elapsed. A plain factual summary, calculated by code, e.g.
  *"38 of 50 leads (76%) with 4 days left; behind pace."*
- Workflows can be linked to goals; results are shown side by side, **without claiming
  the AI caused them**. The wording is "recorded while this workflow was active".
- Feedback (useful / not useful / needs improvement + note) is stored and the most
  relevant recent feedback is included in future context for the same agent/workflow.

### 4.10 Dashboard navigation (consolidated from 9 to 7)

| Menu item | Contains |
|---|---|
| **Overview** | Goals at a glance, running workflows, recommendations, pending approvals, recent results |
| **Work** | Start a workflow or a single task; runs with step-by-step progress and hand-offs (*merges "Workflows" and "Tasks"*) |
| **Goals & Insights** | Goals, measurements, progress, performance summaries (*merges "Goals" and "Insights"*) |
| **Approvals** | Pending decisions with evidence; decision history |
| **Business Brain** | Profile, documents, knowledge (with source labels), decisions, lessons |
| **AI Team** | Agents, capabilities, on/off |
| **Activity Log** | Auditable events, AI usage and cost |

Every AI-generated item displays a label: **Verified · Your input · AI suggestion ·
Assumption · Measured result**, and proposed work is visually distinct from completed work.

### 4.11 Observability, versioning, provenance, security, testing

| Need | Approach |
|---|---|
| Activity log | `ActivityEvent` table: what happened, who/what did it, related records, details. |
| AI usage and cost | `AiCall` table: model, tokens in/out, estimated cost, duration, step. Budgets read from here. |
| Versioning | Every task/run stores agent version, workflow version, model ID and AI mode. |
| Provenance | Claims store the IDs of the Brain items/documents/steps they used; context builder records what it supplied. |
| Workspace security | All data access goes through service functions that **require** a workspace ID; automated tests prove cross-workspace reads return nothing. Login comes after the MVP. |
| Failure recovery | Per-step saved state; Retry resumes from the failed step. |
| Testing | **Vitest** (a small, standard test runner) for unit and integration tests against a separate test database, plus scripted browser tests for the key journeys. Mock mode makes all of it free to run. |

### 4.12 Live AI (Claude)

- Official Anthropic SDK (`@anthropic-ai/sdk`), added in Phase C behind `AI_MODE=live`.
- Default model: **Claude Opus 5.5** (`claude-opus-5-5`), currently $4 per million input
  tokens and $20 per million output tokens. I verified this against current Anthropic
  reference material for this session; it should be re-checked before launch.
- Uses structured outputs for the agent result shape, and streaming for long responses.
- **Rough cost estimate** (an assumption, to be measured once live): a 3–4-agent workflow
  ≈ 4–6 AI calls ≈ **$0.25–$0.80 per run**. Using a cheaper model or lower "effort" for
  low-risk steps can reduce this. That is a business decision we can make with real
  usage data; I won't switch models without your say-so.
- The API key lives only in `.env.local` (never committed) and is used only on the server.

---

## 5. Unnecessary complexity to avoid

| Tempting idea | Why not now | Instead |
|---|---|---|
| Vector database / embeddings | Small data volumes; adds cost and moving parts | Scored keyword + metadata retrieval |
| AI freely designing multi-step plans | Unpredictable, hard to test, can loop | AI picks from tested workflow templates |
| Separate job queue / worker service | Infrastructure a non-developer must run | Step-by-step resumable runs in the app; revisit for production hosting |
| Always-on autonomous agents | Cost and control risk | Check-on-visit monitoring |
| AI reviewer on every output | Doubles cost | Rule checks first; AI review for high-risk steps only |
| A table per memory concept | Many migrations, rigid | A few general tables with `kind` and `source` |
| Agent marketplace, integrations, analytics connectors | Out of MVP scope | Permission and data model designed to allow them later |

---

## 6. Dependencies between components

```
A: Brain tables + provenance + activity log + tests
        │
        ▼
B: Registry v2 ─► Structured output ─► Workflow engine (steps, dependencies, limits, resume)
        │                                   │
        ▼                                   ▼
C: Quality gate ─► 3 workflow templates ─► Live Claude provider
        │
        ▼
D: Approvals ─► Decision memory;  Goals/measurements ─► Outcome summaries;  Feedback ─► context
        │
        ▼
E: Goal monitoring ─► Recommendations ─► Approvals
        │
        ▼
F: Navigation/UX polish, progress visuals, end-to-end tests, docs
```

Approvals (needed by D and E) depend on structured output (B). The context builder (A/D)
is used by every agent step.

---

## 7. Implementation phases

Each phase ends with: automated tests passing, a regression check of earlier features,
a plain-English summary, and step-by-step instructions for you to try it. **I'll stop for
your approval after every phase.**

| Phase | What gets built | You'll be able to… | Difficulty |
|---|---|---|---|
| **A: Foundation & data** | Test runner and first tests; Brain tables (Document, KnowledgeItem, Goal, GoalMeasurement, Decision, Feedback, ActivityEvent, AiCall); source labels and the "only the founder verifies" rule; 2 new profile fields; workspace isolation tests; activity log for existing actions; fix for stuck tasks | See an Activity Log page; add goals and knowledge notes with source labels (simple forms) | Medium |
| **B: Orchestration engine** | Registry v2; structured agent output (mock); context builder; WorkflowRun + step tasks with dependencies; limits, cancel, retry, resume; hand-off visibility | Run a multi-step workflow in mock mode and watch Research → Strategy → Marketing progress live | **High** (core of the system) |
| **C: Quality & workflows & live AI** | Quality gate (rules + optional AI reviewer); revision loop; the 3 workflow templates; planner (objective → template + goal draft); Claude provider with cost tracking and budgets | Type the launch scenario and get a validated, consolidated plan, in mock or (with an API key) real AI | High |
| **D: Business intelligence** | Approvals UI (approve / reject / revise) → Decision memory; document upload (text and PDF); goal progress and factual summaries; feedback buttons; history fed into context | Approve/reject proposed actions, record results, rate outputs, and see future work use them | Medium |
| **E: Proactive** | Check-on-visit monitoring, recommendations, duplicate prevention, approval hook | Get "you're behind on this goal, want help?" nudges | Low–Medium |
| **F: Experience & polish** | New 7-item navigation, Overview redesign, progress visuals, empty states, error wording, mobile layout, full end-to-end test of the success scenario, docs | Use the complete MVP end to end | Medium |

**One change from your proposed order:** approvals move into **Phase D** (from "human
control") because they need the structured output from B. Decisions are recorded from
approvals, so Decision Memory also lands in D.

---

## 8. Technical risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Background work stops when the app restarts or when hosted on serverless platforms with time limits | Medium | Step-by-step saved state + resume; for production hosting, revisit with a durable job option (decision at deploy time, costs explained then) |
| AI output doesn't follow the required shape | Low with structured outputs | Schema validation, one retry, then a clear failure state |
| AI costs higher than expected | Medium | Per-run and daily budgets, cost records, mock mode by default, AI review only for high-risk steps |
| AI states guesses as facts | High (inherent) | Provenance labels, evidence check downgrades uncited "facts", only the founder can mark verified, visible labels |
| Uploaded documents containing instructions ("prompt injection") | Low–Medium | Documents passed as labelled data; agents can't execute actions; approvals |
| Context gets too large or irrelevant | Medium | Size budget + relevance scoring + tests |
| Schema changes on your existing database | Low | Additive migrations only; no data deleted; applied automatically by `npm run dev` |
| Scope creep / long build time | Medium | Phases with approval gates; postpone list (§5) |
| Next.js 16 behaving differently from older versions | Medium | I check the bundled Next.js docs before using any feature (already standard practice here) |
| No login yet (single workspace) | Known | Isolation enforced and tested in the data layer now; login + request protection right after MVP |

---

## 9. Expected benefits

- **Differentiation:** coordinated, checked, goal-linked deliverables rather than chat answers.
- **Trust:** every statement shows where it came from; nothing consequential happens
  without approval; every step is logged.
- **Compounding value (the moat):** decisions, outcomes and feedback make each workspace's
  future results more specific to that business, without mixing customers' data.
- **Scalability:** new agents and workflows are config files; the engine, Brain and
  dashboard don't change.
- **Cost control:** mock mode for building and testing, budgets and usage tracking for live use.

---

## 10. What the finished MVP will actually do

A founder fills in their profile, uploads a few documents, and types:

> "I want to launch a new AI-powered productivity app for freelancers. Help me validate
> the idea and create a go-to-market strategy."

ThePlatform will:

1. Recognise this as **Idea Validation followed by Marketing Strategy**, and propose a
   measurable goal (e.g. "100 beta sign-ups in 60 days") for the founder to confirm or edit.
2. Run Research → *quality check* → Strategy (using the checked research) →
   *quality check* → Marketing (using approved positioning) → *quality check* →
   consolidation, showing each step and hand-off live.
3. Present one deliverable: market overview, customer problem, competitors,
   differentiation, positioning, channels, messaging, campaign, KPIs and a plan. Every
   key statement is labelled *verified / your input / AI suggestion / assumption*, and
   risks and open questions are listed.
4. Put proposed actions (e.g. "spend $300 on a beta ad test") into **Approvals** with
   reasoning and expected consequences.
5. Record the founder's approvals, rejections, revision requests and feedback as memory.
6. Let the founder record results later ("62 sign-ups so far"), show progress against
   the target, and nudge them if behind.
7. Use all of this, including what worked and what was rejected, the next time a
   related workflow runs.

What it will **not** do in the MVP: publish, send, or spend anything; connect to external
tools or analytics; run without the founder opening it; support multiple users or
logins; guarantee that AI statements are true. It will clearly label which statements
are verified and which are not.

---

## 11. Progress log

### Phase A: Foundation & data ✅
| Planned | Done | Notes |
|---|---|---|
| Test runner + first tests | ✅ | Vitest, separate `prisma/test.db`, 32 tests (`npm test`) |
| Brain tables | ✅ | Document, KnowledgeItem, Goal, GoalMeasurement, Decision, Feedback, ActivityEvent, AiCall (additive migration; existing data preserved and verified) |
| Source labels + "only the founder verifies" | ✅ | Enforced in `src/brain/knowledge.ts`, covered by tests |
| 2 new profile fields | ✅ | Value proposition, competitive positioning |
| Workspace isolation tests | ✅ | `tests/isolation.test.ts`: reads, writes and cross-links between two businesses |
| Activity log | ✅ | Profile, agent switches, tasks (created/completed/failed/interrupted/retried), knowledge, goals |
| Stuck-task fix | ✅ | Tasks with no progress for 10 min are marked interrupted; Retry button |
| Simple pages | ✅ | Business Brain, Goals, Activity log |

Not yet connected (by design, comes in later phases): agents don't read the Brain yet (B);
Documents, Decisions, Feedback and AiCall tables exist but have no screens yet (C/D).
