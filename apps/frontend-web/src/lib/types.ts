export type AuthUser = {
  id: number;
  username: string;
  email: string;
};

export type CatalogCategory = {
  id: number;
  parent_category_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  prompt_count: number;
};

export type LlmFrameworkSummary = {
  id: number;
  name: string;
  slug: string;
};

export type CatalogLlmModelThinkingEffort = {
  id: number;
  name: string;
  slug: string;
  is_default: boolean;
};

export type CatalogLlmModelSummary = {
  id: number;
  name: string;
  slug: string;
};

export type CatalogLlmFramework = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  model_count: number;
};

export type CatalogLlmModel = {
  id: number;
  creator_id: number;
  name: string;
  slug: string;
  thinking_efforts: CatalogLlmModelThinkingEffort[];
};

export type CatalogReview = {
  id: number;
  reviewer_id: number;
  stars: number;
  comment: string | null;
  reviewer_name: string;
  llm_model: CatalogLlmModelSummary;
  llm_framework: LlmFrameworkSummary;
  thinking_effort: CatalogLlmModelThinkingEffort;
  created_at: string;
};

export type CatalogPromptFollowUp = {
  id: number;
  position: number;
  body: string;
};

export type CatalogPrompt = {
  id: number;
  creator_id: number;
  name: string;
  slug: string;
  prompt: string;
  follow_up_prompts: CatalogPromptFollowUp[];
  execution_type: PromptExecutionType;
  is_public: boolean;
  author_name: string;
  category: CatalogCategory;
  review_count: number;
  average_stars: number | null;
};

export type PromptExecutionType = "agent" | "plan" | "ask" | "unknown";

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
  thinkingEffort: string;
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