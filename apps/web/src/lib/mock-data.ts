import type { Category, PromptRecord } from "@/lib/types";

export const categories: Category[] = [
  {
    id: "cat-product",
    name: "Product Discovery",
    slug: "product-discovery",
    description: "Prompts for interviews, synthesis, positioning, and decision framing.",
    promptCount: 2,
  },
  {
    id: "cat-engineering",
    name: "Engineering Systems",
    slug: "engineering-systems",
    description: "Prompts for architecture, code review, incident learning, and tradeoffs.",
    promptCount: 1,
  },
  {
    id: "cat-marketing",
    name: "Launch Narrative",
    slug: "launch-narrative",
    description: "Prompts that help shape release notes, demos, and campaign angles.",
    promptCount: 1,
  },
];

export const prompts: PromptRecord[] = [
  {
    id: "prompt-interview-cluster",
    slug: "interview-cluster-synthesis",
    name: "Interview Cluster Synthesis",
    authorName: "Mira Chen",
    category: categories[0],
    tags: ["research", "synthesis", "insights"],
    prompt:
      "Read the following interview notes. Group evidence into themes, call out contradictions, identify high-frequency pains, and finish with the three most defensible product opportunities. For every claim, cite the supporting quote IDs.",
    reviews: [
      {
        id: "review-1",
        authorName: "Benedikt",
        stars: 9,
        llmModelName: "GPT-5.4",
        thinkingEffort: "high",
        llmFramework: "VS Code Copilot",
        notes: "Strong structure and very good at separating signal from anecdote. Needed only minor guardrails for quoting.",
        createdAt: "2026-04-20",
      },
      {
        id: "review-2",
        authorName: "Nora Singh",
        stars: 8,
        llmModelName: "Claude 4.1 Sonnet",
        thinkingEffort: "medium",
        llmFramework: "Claude App",
        notes: "Great synthesis quality, but I had to add an instruction to keep the output under one page.",
        createdAt: "2026-04-18",
      },
    ],
  },
  {
    id: "prompt-architecture-review",
    slug: "architecture-decision-review",
    name: "Architecture Decision Review",
    authorName: "Jules Martin",
    category: categories[1],
    tags: ["architecture", "tradeoffs", "backend"],
    prompt:
      "Review this architecture proposal as a principal engineer. Identify hidden coupling, operational risk, migration cost, and observability gaps. End with a go/no-go recommendation and the smallest viable proof-of-concept.",
    reviews: [
      {
        id: "review-3",
        authorName: "Riley Fox",
        stars: 10,
        llmModelName: "o4-mini",
        thinkingEffort: "high",
        llmFramework: "OpenAI Playground",
        notes: "Excellent on risk decomposition. The POC recommendations were concrete enough to schedule immediately.",
        createdAt: "2026-04-19",
      },
      {
        id: "review-4",
        authorName: "Riley Fox",
        stars: 7,
        llmModelName: "GPT-5.4",
        thinkingEffort: "low",
        llmFramework: "VS Code Copilot",
        notes: "Fast pass was useful, but it missed a few observability concerns until I raised the effort.",
        createdAt: "2026-04-21",
      },
    ],
  },
  {
    id: "prompt-release-narrative",
    slug: "release-narrative-composer",
    name: "Release Narrative Composer",
    authorName: "Leah Ortega",
    category: categories[2],
    tags: ["launch", "storytelling", "copy"],
    prompt:
      "Turn these product changes into a launch narrative with a clear audience, problem statement, promise, proof, and CTA. Avoid hype words and keep every benefit tied to a specific capability.",
    reviews: [
      {
        id: "review-5",
        authorName: "Cameron Bell",
        stars: 8,
        llmModelName: "Gemini 2.5 Pro",
        thinkingEffort: "medium",
        llmFramework: "AI Studio",
        notes: "Very clean structure. I still rewrote the CTA to match our house voice, but the core narrative was solid.",
        createdAt: "2026-04-17",
      },
    ],
  },
];

export function getPromptBySlug(slug: string) {
  return prompts.find((prompt) => prompt.slug === slug);
}

export function averageStars(prompt: PromptRecord) {
  const total = prompt.reviews.reduce((sum, review) => sum + review.stars, 0);

  return Number((total / prompt.reviews.length).toFixed(1));
}