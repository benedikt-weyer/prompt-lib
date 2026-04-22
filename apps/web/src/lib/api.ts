import type { CatalogCategory, CatalogPrompt } from "@/lib/types";

export const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

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