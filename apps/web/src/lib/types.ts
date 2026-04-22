export type ThinkingEffort = "low" | "medium" | "high";

export type AuthUser = {
  id: number;
  username: string;
  email: string;
};

export type CatalogCategory = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  prompt_count: number;
};

export type CatalogPrompt = {
  id: number;
  name: string;
  slug: string;
  prompt: string;
  author_name: string;
  category: CatalogCategory;
  review_count: number;
  average_stars: number | null;
};

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