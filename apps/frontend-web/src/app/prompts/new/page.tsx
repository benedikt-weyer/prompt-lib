"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { CreatePromptForm } from "@/components/prompts/create-prompt-form";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchPromptBySlug } from "@/lib/api";
import type { CatalogPrompt } from "@/lib/types";

type NewPromptPageLayoutProps = {
  cardContent: React.ReactNode;
  description: string;
  title: string;
};

function NewPromptPageLayout({ cardContent, description, title }: NewPromptPageLayoutProps) {
  const isImprovementFlow = title === "Create a prompt improvement";

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10 lg:px-8 lg:py-16">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">Prompts</p>
          <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{description}</p>
        </div>
        <Card className="border-border/70 bg-card/95">
          <CardHeader>
            <CardTitle>{isImprovementFlow ? "New prompt improvement" : "New prompt"}</CardTitle>
          </CardHeader>
          <CardContent>{cardContent}</CardContent>
        </Card>
      </main>
    </div>
  );
}

function NewPromptPageContent() {
  const searchParams = useSearchParams();
  const sourcePromptSlug = searchParams.get("sourcePrompt");
  const [sourcePrompt, setSourcePrompt] = useState<CatalogPrompt | null>(null);
  const [loadingSourcePrompt, setLoadingSourcePrompt] = useState(Boolean(sourcePromptSlug));
  const [sourcePromptError, setSourcePromptError] = useState<string | null>(null);

  useEffect(() => {
    if (!sourcePromptSlug) {
      return;
    }

    let cancelled = false;

    async function loadSourcePrompt(promptSlug: string) {
      setLoadingSourcePrompt(true);
      setSourcePrompt(null);
      setSourcePromptError(null);

      try {
        const prompt = await fetchPromptBySlug(promptSlug);

        if (!cancelled) {
          setSourcePrompt(prompt);
          if (prompt === null) {
            setSourcePromptError("The source prompt could not be found.");
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setSourcePromptError(loadError instanceof Error ? loadError.message : "Failed to load source prompt.");
        }
      } finally {
        if (!cancelled) {
          setLoadingSourcePrompt(false);
        }
      }
    }

    void loadSourcePrompt(sourcePromptSlug);

    return () => {
      cancelled = true;
    };
  }, [sourcePromptSlug]);

  const activeSourcePrompt = sourcePromptSlug ? sourcePrompt : null;
  const activeSourcePromptError = sourcePromptSlug ? sourcePromptError : null;
  const isImprovementFlow = activeSourcePrompt !== null;

  return (
    <NewPromptPageLayout
      title={isImprovementFlow ? "Create a prompt improvement" : "Create a prompt"}
      description={
        isImprovementFlow
          ? `Start from ${activeSourcePrompt.name}, adjust the text as needed, and it will be linked back as a proposed improvement when you save it.`
          : "Pick a category, write the main prompt body, and add any follow-up prompts that should continue the interaction."
      }
      cardContent={
        <>
          {loadingSourcePrompt ? <p className="text-sm text-muted-foreground">Loading source prompt...</p> : null}
          {activeSourcePromptError ? <p className="mb-4 text-sm text-destructive">{activeSourcePromptError}</p> : null}
          {loadingSourcePrompt ? null : <CreatePromptForm sourcePromptForImprovement={activeSourcePrompt ?? undefined} />}
        </>
      }
    />
  );
}

export default function NewPromptPage() {
  return (
    <Suspense
      fallback={
        <NewPromptPageLayout
          title="Create a prompt"
          description="Pick a category, write the main prompt body, and add any follow-up prompts that should continue the interaction."
          cardContent={<p className="text-sm text-muted-foreground">Loading prompt builder...</p>}
        />
      }
    >
      <NewPromptPageContent />
    </Suspense>
  );
}