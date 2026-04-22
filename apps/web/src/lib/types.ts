export type ThinkingEffort = "low" | "medium" | "high";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  promptCount: number;
};

export type Review = {
  id: string;
  authorName: string;
  stars: number;
  llmModelName: string;
  thinkingEffort: ThinkingEffort;
  llmFramework: string;
  notes: string;
  createdAt: string;
};

export type PromptRecord = {
  id: string;
  slug: string;
  name: string;
  prompt: string;
  authorName: string;
  category: Category;
  tags: string[];
  reviews: Review[];
};