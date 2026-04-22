"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchLlmFrameworks, fetchLlmModels } from "@/lib/api";
import type { CatalogLlmFramework, CatalogLlmModel } from "@/lib/types";
import { cn } from "@/lib/utils";

function FrameworkSection({
  frameworks,
  loading,
}: Readonly<{
  frameworks: CatalogLlmFramework[];
  loading: boolean;
}>) {
  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading frameworks...</p>;
  }

  if (frameworks.length === 0) {
    return (
      <Card className="border-border/70 bg-card/90">
        <CardHeader>
          <CardTitle>No frameworks yet</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>Create the first framework so review runs can capture where prompts were executed.</span>
          <Link href="/frameworks/new" className={cn(buttonVariants({ size: "sm" }), "rounded-full")}>
            Create framework
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
      {frameworks.map((framework) => (
        <Card key={framework.id} className="border-border/70 bg-card/90">
          <CardHeader className="gap-4">
            <div className="flex flex-wrap gap-2">
              <Badge className="rounded-full bg-secondary text-secondary-foreground">Framework</Badge>
              <Badge variant="outline" className="rounded-full">{framework.model_count} linked reviews</Badge>
            </div>
            <CardTitle className="text-2xl">{framework.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-7 text-muted-foreground">
              {framework.description?.trim() || "No description yet."}
            </p>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Slug</span>
              <span className="font-medium text-foreground">{framework.slug}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ModelSection({
  models,
  loading,
}: Readonly<{
  models: CatalogLlmModel[];
  loading: boolean;
}>) {
  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading models...</p>;
  }

  if (models.length === 0) {
    return (
      <Card className="border-border/70 bg-card/90">
        <CardHeader>
          <CardTitle>No models yet</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>Create the first model, then open its edit screen to manage thinking efforts.</span>
          <Link href="/models/new" className={cn(buttonVariants({ size: "sm" }), "rounded-full")}>
            Create model
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
      {models.map((model) => (
        <Card key={model.id} className="border-border/70 bg-card/90">
          <CardHeader className="gap-4">
            <div className="flex flex-wrap gap-2">
              <Badge className="rounded-full bg-secondary text-secondary-foreground">Model</Badge>
              <Badge variant="outline" className="rounded-full">
                {model.thinking_efforts.length} thinking efforts
              </Badge>
            </div>
            <CardTitle className="text-2xl">{model.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Thinking effort preview</p>
              <div className="flex flex-wrap gap-2">
                {model.thinking_efforts.map((thinkingEffort) => (
                  <Badge
                    key={thinkingEffort.id}
                    variant={thinkingEffort.is_default ? "secondary" : "outline"}
                    className="rounded-full"
                  >
                    {thinkingEffort.name}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Slug</span>
              <span className="font-medium text-foreground">{model.slug}</span>
            </div>
            <Link
              href={`/models/${model.slug}/edit`}
              className={cn(buttonVariants({ variant: "outline" }), "w-full rounded-full")}
            >
              Edit model and efforts
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function LlmConfigPage() {
  const [frameworks, setFrameworks] = useState<CatalogLlmFramework[]>([]);
  const [models, setModels] = useState<CatalogLlmModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadConfig() {
      try {
        const [loadedFrameworks, loadedModels] = await Promise.all([fetchLlmFrameworks(), fetchLlmModels()]);

        if (!cancelled) {
          setFrameworks(loadedFrameworks);
          setModels(loadedModels);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load LLM configuration.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10 lg:px-8 lg:py-16">
        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">LLM config</p>
            <h1 className="text-4xl font-semibold tracking-tight">Models, frameworks, and thinking-effort previews</h1>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
              Use this page as the control surface for LLM review metadata. Frameworks are managed independently, and thinking efforts are owned by each model through its edit screen.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/frameworks/new" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full")}>
              New framework
            </Link>
            <Link href="/models/new" className={cn(buttonVariants({ size: "lg" }), "rounded-full")}>
              New model
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="text-base">Frameworks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight">{frameworks.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="text-base">Models</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight">{models.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="text-base">Thinking efforts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight">
                {models.reduce((count, model) => count + model.thinking_efforts.length, 0)}
              </p>
            </CardContent>
          </Card>
        </section>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Frameworks</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">Existing framework records</h2>
            </div>
            <Link href="/frameworks/new" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}>
              Add framework
            </Link>
          </div>
          <FrameworkSection frameworks={frameworks} loading={loading} />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Models</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">Edit models and their thinking efforts</h2>
            </div>
            <Link href="/models/new" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}>
              Add model
            </Link>
          </div>
          <ModelSection models={models} loading={loading} />
        </section>
      </main>
    </div>
  );
}