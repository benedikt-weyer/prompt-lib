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
import type { CatalogCategory } from "@/lib/types";

type CreateCategoryResult = CatalogCategory & {
  message?: string;
};

type CreateCategoryFormProps = {
  redirectPath?: string;
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

export function CreateCategoryForm({ redirectPath = "/categories" }: Readonly<CreateCategoryFormProps>) {
  const router = useRouter();
  const { user, loading } = useAuth();
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

  const categoriesById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);

  async function submitCategory(formData: FormData) {
    setPending(true);
    setError(null);

    const nameValue = formData.get("name");
    const descriptionValue = formData.get("description");
    const parentCategoryValue = formData.get("parentCategoryId");

    const name = typeof nameValue === "string" ? nameValue.trim() : "";
    const description = typeof descriptionValue === "string" ? descriptionValue.trim() : "";
    const parentCategoryId =
      typeof parentCategoryValue === "string" && parentCategoryValue.length > 0
        ? Number(parentCategoryValue)
        : null;

    try {
      const response = await fetch(`${apiUrl}/api/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name,
          description,
          parent_category_id: parentCategoryId,
        }),
      });

      const result = (await response.json().catch(() => null)) as CreateCategoryResult | null;

      if (!response.ok) {
        setError(result?.message ?? "Category creation failed.");
        return;
      }

      startTransition(() => {
        router.push(redirectPath);
        router.refresh();
      });
    } catch {
      setError("The API could not be reached. Confirm the backend is running and try again.");
    } finally {
      setPending(false);
    }
  }

  if (!loading && !user) {
    return (
      <p className="text-sm text-muted-foreground">
        You need to <Link href="/login" className="font-medium text-primary">log in</Link> before creating categories.
      </p>
    );
  }

  return (
    <>
      <form
        className="grid gap-4"
        action={async (formData) => {
          await submitCategory(formData);
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="name">Category name</Label>
          <Input id="name" name="name" placeholder="Evaluation Workflows" disabled={pending} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="parentCategoryId">Parent category</Label>
          <select
            id="parentCategoryId"
            name="parentCategoryId"
            disabled={pending || loadingCategories}
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
            defaultValue=""
          >
            <option value="">No parent category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {buildCategoryLabel(category, categoriesById)}
              </option>
            ))}
          </select>
          <p className="text-sm text-muted-foreground">
            Leave this empty to create a main category. Choose a parent to create a subcategory.
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            className="min-h-28"
            placeholder="Explain what kinds of prompts belong in this category."
            disabled={pending}
          />
        </div>
        <Button type="submit" disabled={pending || loading}>
          {pending ? "Creating category..." : "Create category"}
        </Button>
      </form>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
    </>
  );
}