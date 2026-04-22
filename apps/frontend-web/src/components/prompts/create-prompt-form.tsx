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
import { getPromptExecutionTypeLabel, promptExecutionTypeOptions } from "@/lib/prompt-execution-type";
import type { CatalogCategory, CatalogPrompt, PromptExecutionType } from "@/lib/types";

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
  const [followUpPrompts, setFollowUpPrompts] = useState<string[]>(
    initialPrompt?.follow_up_prompts.map((followUpPrompt) => followUpPrompt.body) ?? [],
  );
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
    const executionTypeValue = formData.get("executionType");
    const followUpPromptValues = formData.getAll("followUpPrompt");
    const visibilityValue = formData.get("visibility");

    const name = typeof nameValue === "string" ? nameValue.trim() : "";
    const prompt = typeof promptValue === "string" ? promptValue.trim() : "";
    const categoryId = typeof categoryValue === "string" ? Number(categoryValue) : Number.NaN;
    const nextFollowUpPrompts = followUpPromptValues
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter((value) => value.length > 0);
    const executionType: PromptExecutionType =
      executionTypeValue === "agent" ||
      executionTypeValue === "plan" ||
      executionTypeValue === "ask" ||
      executionTypeValue === "unknown"
        ? executionTypeValue
        : "unknown";
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
          follow_up_prompts: nextFollowUpPrompts,
          category_id: categoryId,
          execution_type: executionType,
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

  function updateFollowUpPrompt(index: number, value: string) {
    setFollowUpPrompts((currentFollowUpPrompts) =>
      currentFollowUpPrompts.map((followUpPrompt, currentIndex) =>
        currentIndex === index ? value : followUpPrompt,
      ),
    );
  }

  function addFollowUpPrompt() {
    setFollowUpPrompts((currentFollowUpPrompts) => [...currentFollowUpPrompts, ""]);
  }

  function removeFollowUpPrompt(index: number) {
    setFollowUpPrompts((currentFollowUpPrompts) =>
      currentFollowUpPrompts.filter((_, currentIndex) => currentIndex !== index),
    );
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
        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <Label>Follow-up prompts</Label>
              <p className="text-sm text-muted-foreground">
                Add optional follow-up prompts that should run after the main prompt body.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addFollowUpPrompt} disabled={pending}>
              Add follow-up
            </Button>
          </div>
          {followUpPrompts.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border/70 px-4 py-3 text-sm text-muted-foreground">
              No follow-up prompts yet. Add one if this prompt should continue as a sequence.
            </p>
          ) : null}
          <div className="grid gap-4">
            {followUpPrompts.map((followUpPrompt, index) => (
              <div key={`follow-up-${index + 1}`} className="rounded-2xl border border-border/70 bg-background/60 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <Label htmlFor={`followUpPrompt-${index + 1}`}>Follow-up {index + 1}</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      removeFollowUpPrompt(index);
                    }}
                    disabled={pending}
                  >
                    Remove
                  </Button>
                </div>
                <Textarea
                  id={`followUpPrompt-${index + 1}`}
                  name="followUpPrompt"
                  className="min-h-32"
                  placeholder="Write the follow-up prompt that should run next."
                  value={followUpPrompt}
                  onChange={(event) => {
                    updateFollowUpPrompt(index, event.target.value);
                  }}
                  disabled={pending}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="executionType">Execution type</Label>
          <select
            id="executionType"
            name="executionType"
            disabled={pending}
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
            defaultValue={initialPrompt?.execution_type ?? "unknown"}
          >
            {promptExecutionTypeOptions.map((executionType) => (
              <option key={executionType} value={executionType}>
                {getPromptExecutionTypeLabel(executionType)}
              </option>
            ))}
          </select>
          <p className="text-sm text-muted-foreground">
            Use this preset to describe how the prompt is intended to execute: agent, plan, ask, or unknown.
          </p>
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