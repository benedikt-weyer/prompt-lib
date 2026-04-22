"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { CreateCategoryForm } from "@/components/categories/create-category-form";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchCategories } from "@/lib/api";
import type { CatalogCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

type CategoryTreeNode = CatalogCategory & {
  children: CategoryTreeNode[];
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

function buildCategoryTree(categories: CatalogCategory[]) {
  const nodes = new Map<number, CategoryTreeNode>();

  for (const category of categories) {
    nodes.set(category.id, { ...category, children: [] });
  }

  const roots: CategoryTreeNode[] = [];

  for (const category of categories) {
    const node = nodes.get(category.id);

    if (!node) {
      continue;
    }

    if (category.parent_category_id === null) {
      roots.push(node);
      continue;
    }

    const parentNode = nodes.get(category.parent_category_id);

    if (!parentNode) {
      roots.push(node);
      continue;
    }

    parentNode.children.push(node);
  }

  const sortNodes = (entries: CategoryTreeNode[]) => {
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      sortNodes(entry.children);
    }
  };

  sortNodes(roots);
  return roots;
}

function CategoryTree({ nodes }: Readonly<{ nodes: CategoryTreeNode[] }>) {
  if (nodes.length === 0) {
    return <p className="text-sm text-muted-foreground">No categories yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {nodes.map((node) => (
        <li key={node.id}>
          <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-foreground">{node.name}</p>
              <Badge variant="outline" className="rounded-full">{node.prompt_count} prompts</Badge>
              {node.parent_category_id === null ? (
                <Badge className="rounded-full bg-secondary text-secondary-foreground">Main</Badge>
              ) : (
                <Badge variant="outline" className="rounded-full">Subcategory</Badge>
              )}
            </div>
            {node.description ? <p className="mt-2 text-sm text-muted-foreground">{node.description}</p> : null}
          </div>
          {node.children.length > 0 ? (
            <div className="ml-6 mt-3 border-l border-border/70 pl-4">
              <CategoryTree nodes={node.children} />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export default function CategoriesOverviewPage() {
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
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
  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);
  const mainCategoryCount = categories.filter((category) => category.parent_category_id === null).length;
  const subcategoryCount = categories.length - mainCategoryCount;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10 lg:px-8 lg:py-16">
        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">Categories</p>
            <h1 className="text-4xl font-semibold tracking-tight">Category overview with main categories and subcategories</h1>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
              Categories now form a tree. Main categories have no parent, and subcategories are attached to another category inside the same collection.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/prompts/new" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full")}>
              New prompt
            </Link>
            <Link href="/prompts" className={cn(buttonVariants({ size: "lg" }), "rounded-full")}>
              Open library
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="text-base">Total categories</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight">{categories.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="text-base">Main categories</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight">{mainCategoryCount}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="text-base">Subcategories</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight">{subcategoryCount}</p>
            </CardContent>
          </Card>
        </section>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-border/70 bg-card/95">
            <CardHeader>
              <CardTitle>Create a category</CardTitle>
            </CardHeader>
            <CardContent>
              <CreateCategoryForm />
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/95">
            <CardHeader>
              <CardTitle>Category tree</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCategories ? <p className="text-sm text-muted-foreground">Loading categories...</p> : null}
              {loadingCategories ? null : <CategoryTree nodes={categoryTree} />}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Preview</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">Existing category records</h2>
          </div>
          {loadingCategories ? <p className="text-sm text-muted-foreground">Loading category previews...</p> : null}
          {!loadingCategories && categories.length === 0 ? (
            <Card className="border-border/70 bg-card/90">
              <CardHeader>
                <CardTitle>No categories yet</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Create the first main category or subcategory to start organizing prompts.
              </CardContent>
            </Card>
          ) : null}
          {!loadingCategories && categories.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {categories.map((category) => (
                <Card key={category.id} className="border-border/70 bg-card/90">
                  <CardHeader className="gap-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge className="rounded-full bg-secondary text-secondary-foreground">
                        {category.parent_category_id === null ? "Main category" : "Subcategory"}
                      </Badge>
                      <Badge variant="outline" className="rounded-full">{category.prompt_count} prompts</Badge>
                    </div>
                    <CardTitle className="text-2xl">{category.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-muted-foreground">
                    <p>{category.description ?? "No description yet."}</p>
                    <div className="space-y-1">
                      <p>
                        <span className="font-medium text-foreground">Path:</span> {buildCategoryLabel(category, categoriesById)}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Slug:</span> {category.slug}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}