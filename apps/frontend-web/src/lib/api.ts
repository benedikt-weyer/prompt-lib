import type {
  CatalogCategory,
  CatalogLlmFramework,
  CatalogLlmModel,
  CatalogPrompt,
  CatalogReview,
} from "@/lib/types";

export const apiUrl = "/backend";

export async function fetchCategories(): Promise<CatalogCategory[]> {
  const response = await fetch(`${apiUrl}/api/categories`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to load categories.");
  }

  return (await response.json()) as CatalogCategory[];
}

export async function fetchPrompts(): Promise<CatalogPrompt[]> {
  const response = await fetch(`${apiUrl}/api/prompts`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to load prompts.");
  }

  return (await response.json()) as CatalogPrompt[];
}

export async function fetchLlmFrameworks(): Promise<CatalogLlmFramework[]> {
  const response = await fetch(`${apiUrl}/api/llm-frameworks`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to load LLM frameworks.");
  }

  return (await response.json()) as CatalogLlmFramework[];
}

export async function fetchLlmModels(frameworkId?: number): Promise<CatalogLlmModel[]> {
  void frameworkId;

  const response = await fetch(`${apiUrl}/api/llm-models`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to load LLM models.");
  }

  return (await response.json()) as CatalogLlmModel[];
}

export async function fetchLlmModelBySlug(slug: string): Promise<CatalogLlmModel | null> {
  const response = await fetch(`${apiUrl}/api/llm-models/slug/${slug}`, {
    cache: "no-store",
    credentials: "include",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to load LLM model.");
  }

  return (await response.json()) as CatalogLlmModel;
}

export async function fetchReviews(promptId: number): Promise<CatalogReview[]> {
  const response = await fetch(`${apiUrl}/api/prompts/${promptId}/reviews`, {
    cache: "no-store",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to load reviews.");
  }

  return (await response.json()) as CatalogReview[];
}

export async function fetchPromptBySlug(slug: string): Promise<CatalogPrompt | null> {
  const response = await fetch(`${apiUrl}/api/prompts/slug/${slug}`, {
    cache: "no-store",
    credentials: "include",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to load prompt.");
  }

  return (await response.json()) as CatalogPrompt;
}