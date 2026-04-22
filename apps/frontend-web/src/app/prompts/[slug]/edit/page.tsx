"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { CreatePromptForm } from "@/components/prompts/create-prompt-form";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchPromptBySlug } from "@/lib/api";
import type { CatalogPrompt } from "@/lib/types";

export default function EditPromptPage() {
  const params = useParams<{ slug: string }>();
  const { user, loading: authLoading } = useAuth();
  const [prompt, setPrompt] = useState<CatalogPrompt | null>(null);
  const [loadingPrompt, setLoadingPrompt] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPrompt() {
      try {
        const payload = await fetchPromptBySlug(params.slug);

        if (!cancelled) {
          setPrompt(payload);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load prompt.");
        }
      } finally {
        if (!cancelled) {
          setLoadingPrompt(false);
        }
      }
    }

    void loadPrompt();

    return () => {
      cancelled = true;
    };
  }, [params.slug]);

  const isOwner = prompt !== null && user?.id === prompt.creator_id;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10 lg:px-8 lg:py-16">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">Prompts</p>
          <h1 className="text-4xl font-semibold tracking-tight">Edit prompt</h1>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
            Update the prompt text, category, and visibility. If you rename it, the slug will update too.
          </p>
        </div>
        <Card className="border-border/70 bg-card/95">
          <CardHeader>
            <CardTitle>Edit prompt</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPrompt || authLoading ? <p className="text-sm text-muted-foreground">Loading prompt...</p> : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {!loadingPrompt && !authLoading && !prompt ? (
              <p className="text-sm text-muted-foreground">The requested prompt could not be found.</p>
            ) : null}
            {!loadingPrompt && !authLoading && prompt && !isOwner ? (
              <p className="text-sm text-muted-foreground">
                You can only edit prompts you created. <Link href={`/prompts/${prompt.slug}`} className="font-medium text-primary">Return to the prompt</Link>.
              </p>
            ) : null}
            {prompt && isOwner ? <CreatePromptForm initialPrompt={prompt} /> : null}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}