"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { EditModelForm } from "@/components/models/edit-model-form";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchLlmModelBySlug } from "@/lib/api";
import type { CatalogLlmModel } from "@/lib/types";

export default function EditModelPage() {
  const params = useParams<{ slug: string }>();
  const { user, loading: authLoading } = useAuth();
  const [model, setModel] = useState<CatalogLlmModel | null>(null);
  const [loadingModel, setLoadingModel] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadModel() {
      try {
        const payload = await fetchLlmModelBySlug(params.slug);

        if (!cancelled) {
          setModel(payload);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load model.");
        }
      } finally {
        if (!cancelled) {
          setLoadingModel(false);
        }
      }
    }

    void loadModel();

    return () => {
      cancelled = true;
    };
  }, [params.slug]);

  const isOwner = model !== null && user?.id === model.creator_id;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10 lg:px-8 lg:py-16">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">LLM models</p>
          <h1 className="text-4xl font-semibold tracking-tight">Edit model</h1>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
            Rename the model and manage the thinking efforts that should be available when someone reviews a prompt with it.
          </p>
        </div>
        <Card className="border-border/70 bg-card/95">
          <CardHeader>
            <CardTitle>Edit model</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingModel || authLoading ? <p className="text-sm text-muted-foreground">Loading model...</p> : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {!loadingModel && !authLoading && !model ? (
              <p className="text-sm text-muted-foreground">The requested model could not be found.</p>
            ) : null}
            {!loadingModel && !authLoading && model && !isOwner ? (
              <p className="text-sm text-muted-foreground">
                You can only edit models you created. <Link href="/prompts" className="font-medium text-primary">Return to the prompt library</Link>.
              </p>
            ) : null}
            {model && isOwner ? <EditModelForm initialModel={model} /> : null}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}