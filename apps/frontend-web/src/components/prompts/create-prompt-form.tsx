"use client";

import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
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

export function CreatePromptForm() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const response = await fetch(`${apiUrl}/api/prompts`, {
        method: "POST",
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
      });

      const result = (await response.json().catch(() => null)) as CreatePromptResult | null;

      if (!response.ok) {
        setError(result?.message ?? "Prompt creation failed.");
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
        Create a <Link href="/categories/new" className="font-medium text-primary">category</Link> first so prompts can be filed correctly.
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
          <Input id="name" name="name" placeholder="Architecture Risk Review" disabled={pending} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="categoryId">Category</Label>
          <select
            id="categoryId"
            name="categoryId"
            disabled={pending || loadingCategories}
            required
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
            defaultValue=""
          >
            <option value="" disabled>
              {loadingCategories ? "Loading categories..." : "Select a category"}
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
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
            defaultValue="private"
          >
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
          <p className="text-sm text-muted-foreground">
            Private prompts are only visible to you. Public prompts appear on the public home page.
          </p>
        </div>
        <Button type="submit" disabled={pending || authLoading || loadingCategories}>
          {pending ? "Creating prompt..." : "Create prompt"}
        </Button>
      </form>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
    </>
  );
}