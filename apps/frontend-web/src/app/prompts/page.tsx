"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchPrompts } from "@/lib/api";
import type { CatalogPrompt } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<CatalogPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPrompts() {
      try {
        const payload = await fetchPrompts();
        if (!cancelled) {
          setPrompts(payload);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load prompts.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPrompts();

    return () => {
      cancelled = true;
    };
  }, []);

  const isEmpty = !loading && error === null && prompts.length === 0;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 lg:px-8 lg:py-16">
        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">Library</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Prompt records with real persisted categories</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/frameworks/new" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full")}>
              New framework
            </Link>
            <Link href="/models/new" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full")}>
              New model
            </Link>
            <Link href="/categories/new" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full")}>
              New category
            </Link>
            <Link href="/prompts/new" className={cn(buttonVariants({ size: "lg" }), "rounded-full")}>
              New prompt
            </Link>
          </div>
        </section>

        {loading ? <p className="text-sm text-muted-foreground">Loading prompts...</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {isEmpty ? (
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle>No prompts yet</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>Create the first category and prompt to populate the library.</span>
              <Link href="/categories/new" className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}>
                Create category
              </Link>
              <Link href="/prompts/new" className={cn(buttonVariants({ size: "sm" }), "rounded-full")}>
                Create prompt
              </Link>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {prompts.map((prompt) => (
            <Card key={prompt.id} className="border-border/70 bg-card/90">
              <CardHeader className="gap-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className="rounded-full bg-secondary text-secondary-foreground">{prompt.category.name}</Badge>
                  <Badge variant="outline" className="rounded-full">{prompt.review_count} reviews</Badge>
                  <Badge variant="outline" className="rounded-full">
                    {prompt.is_public ? "Public" : "Private"}
                  </Badge>
                </div>
                <CardTitle className="text-2xl">{prompt.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="line-clamp-5 text-sm leading-7 text-muted-foreground">{prompt.prompt}</p>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Created by {prompt.author_name}</span>
                  <span className="font-medium text-foreground">
                    {prompt.average_stars === null ? "No ratings" : `${prompt.average_stars} / 10`}
                  </span>
                </div>
                <Link href={`/prompts/${prompt.slug}`} className={cn(buttonVariants({ variant: "outline" }), "w-full rounded-full")}>
                  Inspect prompt
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}