import { z } from "zod";

// The company profile questions. Shared by the form (what to show) and the
// server (what to accept), and later by the agents (what they know about you).

export const INDUSTRIES = [
  "Retail & E-commerce",
  "Food & Hospitality",
  "Professional Services",
  "Health & Wellness",
  "Technology & Software",
  "Construction & Trades",
  "Real Estate",
  "Education & Training",
  "Creative & Media",
  "Manufacturing",
  "Finance & Insurance",
  "Beauty & Personal Care",
  "Nonprofit",
  "Other",
] as const;

export const BUSINESS_MODELS = [
  "Sells to consumers (B2C)",
  "Sells to businesses (B2B)",
  "Both B2B and B2C",
  "Nonprofit / mission-driven",
] as const;

export const STAGES = ["Idea", "Just started (under 1 year)", "Growing (1–5 years)", "Established (5+ years)"] as const;

export const TEAM_SIZES = ["Just me", "2–10", "11–50", "51–200", "200+"] as const;

type Field = {
  name: keyof ProfileInput;
  label: string;
  help?: string;
  placeholder?: string;
  kind: "text" | "textarea" | "select";
  options?: readonly string[];
  required?: boolean;
};

export const PROFILE_SECTIONS: { title: string; description: string; fields: Field[] }[] = [
  {
    title: "The basics",
    description: "Who you are.",
    fields: [
      { name: "name", label: "Company name", kind: "text", required: true, placeholder: "e.g. Sunrise Bakery" },
      { name: "website", label: "Website", kind: "text", placeholder: "https://…" },
      { name: "industry", label: "Industry", kind: "select", options: INDUSTRIES },
      { name: "businessModel", label: "Who do you sell to?", kind: "select", options: BUSINESS_MODELS },
      { name: "stage", label: "Business stage", kind: "select", options: STAGES },
      { name: "teamSize", label: "Team size", kind: "select", options: TEAM_SIZES },
      { name: "location", label: "Where do you operate?", kind: "text", placeholder: "e.g. Chicago area, or online across the US" },
    ],
  },
  {
    title: "What you offer",
    description: "Your agents use this to understand your business.",
    fields: [
      { name: "description", label: "Describe your business in a few sentences", kind: "textarea" },
      { name: "productsServices", label: "Main products or services (and prices, if you like)", kind: "textarea" },
      { name: "targetCustomers", label: "Who are your ideal customers?", kind: "textarea", placeholder: "Age, location, type of business, needs…" },
      { name: "competitors", label: "Main competitors", kind: "textarea", help: "Names or websites, one per line. Leave blank if unsure — the Research Agent can help." },
    ],
  },
  {
    title: "Direction",
    description: "Where you want to go.",
    fields: [
      { name: "goals", label: "Top goals for the next 12 months", kind: "textarea", placeholder: "e.g. Double online sales, open a second location" },
      { name: "challenges", label: "Biggest challenges right now", kind: "textarea" },
      { name: "brandVoice", label: "Brand voice", kind: "text", placeholder: "e.g. Friendly and down-to-earth" },
    ],
  },
];

const text = (max: number) => z.string().trim().max(max, `Please keep this under ${max} characters.`);

export const profileSchema = z.object({
  name: text(120).min(1, "Please enter your company name."),
  website: text(300),
  industry: text(100),
  businessModel: text(100),
  stage: text(100),
  teamSize: text(50),
  location: text(300),
  description: text(3000),
  productsServices: text(3000),
  targetCustomers: text(3000),
  competitors: text(3000),
  goals: text(3000),
  challenges: text(3000),
  brandVoice: text(300),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const PROFILE_FIELD_NAMES = Object.keys(profileSchema.shape) as (keyof ProfileInput)[];

// How much of the profile is filled in (0–100), shown on the dashboard.
export function profileCompleteness(profile: ProfileInput): number {
  const filled = PROFILE_FIELD_NAMES.filter((key) => profile[key].trim() !== "").length;
  return Math.round((filled / PROFILE_FIELD_NAMES.length) * 100);
}
