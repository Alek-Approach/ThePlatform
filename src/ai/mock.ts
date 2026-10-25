import type { AIProvider, AgentRunInput, AgentRunOutput, RouteDecision, RouteInput } from "./types";
import type { ProfileInput } from "@/lib/profile";

// Mock mode: free, instant sample answers built from the company profile.
// They show what each agent's work will look like without spending money on AI.
// Tip for testing: include the word [fail] in a task to simulate an AI error.

const KEYWORDS: Record<string, string[]> = {
  "market-research": [
    "competitor", "competition", "market", "customer", "persona", "audience", "trend", "research",
    "survey", "pricing", "price", "industry", "demand", "benchmark", "who buys", "segment",
  ],
  marketing: [
    "campaign", "post", "social", "instagram", "facebook", "linkedin", "tiktok", "email", "newsletter",
    "ad ", "ads", "advert", "content", "brand", "slogan", "headline", "copy", "seo", "promote", "launch", "write",
  ],
  "business-strategy": [
    "strategy", "strategic", "plan", "swot", "goal", "grow", "growth", "expand", "priorit", "decide",
    "should we", "should i", "roadmap", "budget", "hire", "profit", "risk", "90-day", "next year",
  ],
};

function routeByKeywords({ task, agents }: RouteInput): RouteDecision {
  const text = ` ${task.toLowerCase()} `;
  const scored = agents.map((agent) => {
    const matches = (KEYWORDS[agent.id] ?? []).filter((word) => text.includes(word));
    return { agent, matches };
  });
  scored.sort((a, b) => b.matches.length - a.matches.length);
  const best = scored[0];

  if (best.matches.length === 0) {
    const fallback = agents.find((a) => a.id === "business-strategy") ?? agents[0];
    return { agentId: fallback.id, reason: `No specific keywords found, so the ${fallback.name} took it as a general business question.` };
  }
  const words = best.matches.map((w) => `“${w.trim()}”`).join(", ");
  return { agentId: best.agent.id, reason: `The task mentions ${words}, which is ${best.agent.name} work.` };
}

const or = (value: string, fallback: string) => (value.trim() ? value.trim() : fallback);
const firstLine = (value: string, fallback: string) => or(value.split("\n")[0] ?? "", fallback);

function context(p: ProfileInput) {
  return {
    company: or(p.name, "your business"),
    industry: or(p.industry, "your industry").toLowerCase(),
    location: or(p.location, "your area"),
    customers: firstLine(p.targetCustomers, "your ideal customers"),
    offer: firstLine(p.productsServices, "your main products and services"),
    goal: firstLine(p.goals, "growing revenue"),
    challenge: firstLine(p.challenges, "limited time and budget"),
    voice: or(p.brandVoice, "friendly and professional"),
  };
}

function marketResearch(task: string, p: ProfileInput): AgentRunOutput {
  const c = context(p);
  return {
    summary: `Market snapshot for ${c.company}: three customer segments, a competitor comparison and two opportunities to act on.`,
    output: `## Market research: ${task}

**Business:** ${c.company} · ${c.industry} · ${c.location}

### Customer segments
| Segment | What they want | How to reach them |
|---|---|---|
| Loyal regulars | Reliability, recognition, convenience | Email, loyalty offers |
| Value seekers | Clear pricing, deals, proof of quality | Comparison content, reviews |
| New discoverers | Something different, a recommendation | Social media, local partnerships |

Your profile describes your ideal customer as: *${c.customers}*. The "loyal regulars" segment is usually the most profitable to grow first.

### Competitor comparison (estimated)
| | ${c.company} | Competitor A | Competitor B |
|---|---|---|---|
| Price position | Mid-range | Budget | Premium |
| Main strength | Personal service | Low price | Brand recognition |
| Weak spot | Visibility | Quality perception | Flexibility |

*Estimates. Add real competitor names to your profile for a sharper comparison.*

### Trends affecting ${c.industry}
- Customers compare options online before buying, so reviews and search visibility matter more each year.
- Demand is growing for convenience (online ordering, booking and fast responses).
- Smaller businesses are winning on personality and local trust.

### Key takeaways
- Focus on your most valuable segment first.
- Your strongest edge over competitors is likely **personal service**. Make it visible.
- Better visibility (reviews, search, social) is the quickest win.

### What I'd research next
- Real prices of your top 3 competitors.
- A 5-question survey of your current customers.

---
*Sample answer (mock mode). Live AI will produce research tailored to your exact question.*`,
  };
}

function marketing(task: string, p: ProfileInput): AgentRunOutput {
  const c = context(p);
  return {
    summary: `A 4-week campaign plan for ${c.company} with ready-to-post content, written in a ${c.voice.toLowerCase()} voice.`,
    output: `## Marketing plan: ${task}

**Goal it supports:** ${c.goal}
**Audience:** ${c.customers}
**Brand voice:** ${c.voice}

### 4-week campaign at a glance
| Week | Theme | Channels | Call to action |
|---|---|---|---|
| 1 | Meet ${c.company} (behind the scenes) | Instagram, Facebook | Follow us |
| 2 | Customer stories and reviews | Social, email | Read the reviews |
| 3 | Spotlight: ${c.offer} | Social, website | Learn more |
| 4 | Limited-time offer | Email, social, in-store/online | Claim the offer |

### Ready-to-use content
**Social post (week 1)**
> Ever wondered what goes on behind the scenes at ${c.company}? 👀 This week we're showing you the people and passion behind what we do. Follow along!

**Email subject lines (week 4)**
1. A thank-you gift from ${c.company} 🎁
2. 48 hours only: something special for you
3. You asked, we listened

### Rough budget and effort
- Content creation: about 3 hours per week.
- Optional paid boost: $50–150 per week on your best-performing post.

### Proposed actions (need your approval)
- Publish the week 1 posts.
- Spend up to $150 on a paid boost in week 4.

### Next steps
- Approve the plan and the first posts.
- Gather 3–5 customer reviews for week 2.
- Decide the week 4 offer.

---
*Sample answer (mock mode). Live AI will write content specific to your request.*`,
  };
}

function businessStrategy(task: string, p: ProfileInput): AgentRunOutput {
  const c = context(p);
  return {
    summary: `Recommendation for ${c.company}: focus on one growth lever for the next 90 days, with clear milestones.`,
    output: `## Strategy: ${task}

### Recommendation
Focus the next 90 days on **one growth lever that directly supports "${c.goal}"**, rather than spreading effort thin. For a ${c.industry} business at your stage, the strongest lever is usually **getting more from existing customers** (repeat purchases and referrals), because it costs less than winning new ones.

### SWOT at a glance
| Strengths | Weaknesses |
|---|---|
| Personal service, local knowledge | Limited time and budget |
| Flexible and quick to change | Low visibility online |

| Opportunities | Threats |
|---|---|
| Growing demand for convenience | Larger competitors' marketing budgets |
| Partnerships with nearby businesses | Rising costs |

### 90-day plan
| When | Milestone | Measure of success |
|---|---|---|
| Days 1–30 | Set up a simple loyalty/referral offer | 20 customers enrolled |
| Days 31–60 | Run a campaign to existing customers | 10% more repeat purchases |
| Days 61–90 | Review results; expand what worked | Decision on next lever |

### Risks and what would change my mind
- **Main challenge you listed:** ${c.challenge}. Keep the plan to about 3 hours a week.
- If research shows a big unmet demand from a new customer group, prioritise acquisition instead.

### Proposed actions (need your approval)
- Commit a small budget (about $200) for loyalty rewards.

### Recommended next steps
- Approve the 90-day focus.
- Ask the Market Research Agent to confirm your most valuable customer segment.
- Ask the Marketing Agent for the customer campaign.

---
*Sample answer (mock mode). Live AI will produce a strategy tailored to your situation.*`,
  };
}

const WRITERS: Record<string, (task: string, p: ProfileInput) => AgentRunOutput> = {
  "market-research": marketResearch,
  marketing,
  "business-strategy": businessStrategy,
};

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockProvider: AIProvider = {
  mode: "mock",

  async routeTask(input) {
    return routeByKeywords(input);
  },

  async runAgent({ agent, profile, task }: AgentRunInput) {
    await pause(1500); // feel like real work
    if (task.toLowerCase().includes("[fail]")) {
      throw new Error("Simulated AI failure (the task contained [fail]).");
    }
    const write = WRITERS[agent.id];
    if (!write) {
      return {
        summary: `Sample result from the ${agent.name}.`,
        output: `## ${agent.name}\n\nThis agent has no sample answer yet.\n\n*Sample answer (mock mode).*`,
      };
    }
    return write(task, profile);
  },
};
