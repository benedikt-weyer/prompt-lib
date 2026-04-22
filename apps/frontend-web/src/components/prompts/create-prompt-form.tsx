"use client";

import Link from "next/link";
import { startTransition, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiUrl, fetchCategories } from "@/lib/api";
import type { CatalogCategory, CatalogPrompt } from "@/lib/types";

type CreatePromptResult = CatalogPrompt & {
  message?: string;
};

function buildCategoryLabel(category: CatalogCategory, categoriesById: Map<number, CatalogCategory>) {
  const parts = [category.name];
  const visited = new Set<number>([category.id]);
  let currentParentId = category.parent_category_id;

  while (currentParentId !== null) {
    const parentCategory = categoriesById.get(currentParentId);

    if (!parentCategory || visited.has(parentCategory.id)) {
      break;
    }

    parts.unshift(parentCategory.name);
    visited.add(parentCategory.id);
    currentParentId = parentCategory.parent_category_id;
  }

  return parts.join(" / ");
}

function getSubmitButtonLabel(isEditMode: boolean, pending: boolean) {
  if (pending) {
    return isEditMode ? "Saving changes..." : "Creating prompt...";
  }

  return isEditMode ? "Save changes" : "Create prompt";
}

type CreatePromptFormProps = {
  initialPrompt?: CatalogPrompt;
};

export function CreatePromptForm({ initialPrompt }: Readonly<CreatePromptFormProps>) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditMode = initialPrompt !== undefined;
  const submitButtonLabel = getSubmitButtonLabel(isEditMode, pending);
  const categoriesById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const payload = await fetchCategories();
        if (!cancelled) {
          setCategories(payload);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load categories.");
        }
      } finally {
        if (!cancelled) {
          setLoadingCategories(false);
        }
      }
    }

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  async function submitPrompt(formData: FormData) {
    setPending(true);
    setError(null);

    const nameValue = formData.get("name");
    const promptValue = formData.get("prompt");
    const categoryValue = formData.get("categoryId");
    const visibilityValue = formData.get("visibility");

    const name = typeof nameValue === "string" ? nameValue.trim() : "";
    const prompt = typeof promptValue === "string" ? promptValue.trim() : "";
    const categoryId = typeof categoryValue === "string" ? Number(categoryValue) : Number.NaN;
    const isPublic = visibilityValue === "public";

    try {
      const response = await fetch(
        isEditMode ? `${apiUrl}/api/prompts/${initialPrompt.id}` : `${apiUrl}/api/prompts`,
        {
          method: isEditMode ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name,
          prompt,
          category_id: categoryId,
          is_public: isPublic,
        }),
        },
      );

      const result = (await response.json().catch(() => null)) as CreatePromptResult | null;

      if (!response.ok) {
        setError(result?.message ?? (isEditMode ? "Prompt update failed." : "Prompt creation failed."));
        return;
      }

      startTransition(() => {
        router.push(`/prompts/${result?.slug ?? ""}`);
        router.refresh();
      });
    } catch {
      setError("The API could not be reached. Confirm the backend is running and try again.");
    } finally {
      setPending(false);
    }
  }

  if (!authLoading && !user) {
    return (
      <p className="text-sm text-muted-foreground">
        You need to <Link href="/login" className="font-medium text-primary">log in</Link> before creating prompts.
      </p>
    );
  }

  if (!loadingCategories && categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Create a <Link href="/categories" className="font-medium text-primary">category</Link> first so prompts can be filed correctly.
      </p>
    );
  }

  return (
    <>
      <form
        className="grid gap-4"
        action={async (formData) => {
          await submitPrompt(formData);
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="name">Prompt name</Label>
          <Input
            id="name"
            name="name"
            placeholder="Architecture Risk Review"
            defaultValue={initialPrompt?.name}
            disabled={pending}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="categoryId">Category</Label>
          <select
            id="categoryId"
            name="categoryId"
            disabled={pending || loadingCategories}
            required
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
            defaultValue={initialPrompt ? String(initialPrompt.category.id) : ""}
          >
            <option value="" disabled>
              {loadingCategories ? "Loading categories..." : "Select a category"}
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {buildCategoryLabel(category, categoriesById)}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="prompt">Prompt body</Label>
          <Textarea
            id="prompt"
            name="prompt"
            className="min-h-48"
            placeholder="Write the prompt exactly as you want to store it."
            defaultValue={initialPrompt?.prompt}
            disabled={pending}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="visibility">Visibility</Label>
          <select
            id="visibility"
            name="visibility"
            disabled={pending}
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
            defaultValue={initialPrompt?.is_public ? "public" : "private"}
          >
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
          <p className="text-sm text-muted-foreground">
            Private prompts are only visible to you. Public prompts appear on the public home page.
          </p>
        </div>
        <Button type="submit" disabled={pending || authLoading || loadingCategories}>
          {submitButtonLabel}
        </Button>
      </form>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
    </>
  );
}