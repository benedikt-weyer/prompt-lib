import type {
  CatalogCategory,
  CatalogLlmFramework,
  CatalogLlmModel,
  CatalogPrompt,
  CatalogReview,
  PromptExecutionType,
} from "@/lib/types";

export const apiUrl = "/backend";

export type PromptMutationPayload = {
  category_id: number;
  name: string;
  prompt: string;
  follow_up_prompts: string[];
  proposed_improvement_prompt_ids: number[];
  execution_type: PromptExecutionType;
  is_public: boolean;
};

async function parsePromptMutationResponse(response: Response): Promise<CatalogPrompt> {
  const payload = (await response.json().catch(() => null)) as CatalogPrompt | { message?: string } | null;

  if (!response.ok) {
    throw new Error(payload && "message" in payload ? payload.message ?? "Prompt request failed." : "Prompt request failed.");
  }

  return payload as CatalogPrompt;
}

export function buildPromptMutationPayload(
  prompt: CatalogPrompt,
  proposedImprovementPromptIds = prompt.proposed_improvement_prompts.map((proposedImprovementPrompt) => proposedImprovementPrompt.id),
): PromptMutationPayload {
  return {
    category_id: prompt.category.id,
    name: prompt.name,
    prompt: prompt.prompt,
    follow_up_prompts: prompt.follow_up_prompts.map((followUpPrompt) => followUpPrompt.body),
    proposed_improvement_prompt_ids: proposedImprovementPromptIds,
    execution_type: prompt.execution_type,
    is_public: prompt.is_public,
  };
}

export async function createPrompt(payload: PromptMutationPayload): Promise<CatalogPrompt> {
  const response = await fetch(`${apiUrl}/api/prompts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return parsePromptMutationResponse(response);
}

export async function updatePrompt(promptId: number, payload: PromptMutationPayload): Promise<CatalogPrompt> {
  const response = await fetch(`${apiUrl}/api/prompts/${promptId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return parsePromptMutationResponse(response);
}

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

export async function fetchLlmModels(): Promise<CatalogLlmModel[]> {

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