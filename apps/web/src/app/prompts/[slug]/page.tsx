"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { CreateReviewForm } from "@/components/reviews/create-review-form";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchPromptBySlug, fetchReviews } from "@/lib/api";
import type { CatalogPrompt, CatalogReview } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function PromptDetailPage() {
  const params = useParams<{ slug: string }>();
  const [prompt, setPrompt] = useState<CatalogPrompt | null>(null);
  const [reviews, setReviews] = useState<CatalogReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPrompt() {
      try {
        const payload = await fetchPromptBySlug(params.slug);

        if (payload !== null) {
          const reviewPayload = await fetchReviews(payload.id);

          if (!cancelled) {
            setReviews(reviewPayload);
          }
        }

        if (!cancelled) {
          setPrompt(payload);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load prompt.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPrompt();

    return () => {
      cancelled = true;
    };
  }, [params.slug]);

  const isMissing = !loading && error === null && prompt === null;

  function handleReviewCreated(review: CatalogReview) {
    setReviews((currentReviews) => [review, ...currentReviews]);
    setPrompt((currentPrompt) => {
      if (currentPrompt === null) {
        return currentPrompt;
      }

      const nextReviewCount = currentPrompt.review_count + 1;
      const currentAverage = currentPrompt.average_stars ?? 0;
      const totalStars = currentAverage * currentPrompt.review_count + review.stars;

      return {
        ...currentPrompt,
        review_count: nextReviewCount,
        average_stars: Number((totalStars / nextReviewCount).toFixed(1)),
      };
    });
  }

  const hasReviews = reviews.length > 0;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-16">
        <section className="space-y-6">
          {loading ? <p className="text-sm text-muted-foreground">Loading prompt...</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {isMissing ? (
            <Card className="border-border/70 bg-card/90">
              <CardHeader>
                <CardTitle>Prompt not found</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                The requested prompt does not exist yet, or the API could not return it.
              </CardContent>
            </Card>
          ) : null}

          {prompt ? (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge className="rounded-full bg-secondary text-secondary-foreground">{prompt.category.name}</Badge>
                <Badge variant="outline" className="rounded-full">{prompt.review_count} review runs</Badge>
                <Badge variant="outline" className="rounded-full">
                  {prompt.average_stars === null ? "No ratings yet" : `Average ${prompt.average_stars} / 10`}
                </Badge>
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-semibold tracking-tight">{prompt.name}</h1>
                <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                  Added by {prompt.author_name}. Reviews now persist against an LLM model, and each model belongs to a single framework with its own linked thinking effort.
                </p>
              </div>
              <Card className="border-border/70 bg-card/90">
                <CardHeader>
                  <CardTitle>Prompt body</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="overflow-x-auto whitespace-pre-wrap rounded-3xl bg-background/80 p-5 font-mono text-sm leading-7 text-foreground">
                    {prompt.prompt}
                  </pre>
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-card/90">
                <CardHeader>
                  <CardTitle>Review runs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hasReviews ? (
                    <div className="space-y-3">
                      {reviews.map((review) => (
                        <div
                          key={review.id}
                          className="rounded-3xl border border-border/70 bg-background/70 p-4"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="rounded-full bg-secondary text-secondary-foreground">
                              {review.stars} / 10
                            </Badge>
                            <Badge variant="outline" className="rounded-full">
                              {review.llm_model.name}
                            </Badge>
                            <Badge variant="outline" className="rounded-full">
                              {review.llm_model.thinking_effort}
                            </Badge>
                            <Badge variant="outline" className="rounded-full">
                              {review.llm_model.framework.name}
                            </Badge>
                          </div>
                          <p className="mt-3 text-sm text-muted-foreground">
                            Reviewed by {review.reviewer_name} on {new Date(review.created_at).toLocaleDateString()}.
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No review runs yet. Add the first one with a model and framework below.
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </section>
        <aside>
          <Card className="sticky top-24 border-border/70 bg-card/95 shadow-[0_30px_80px_-65px_var(--primary)]">
            <CardHeader>
              <CardTitle>Add review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
              {prompt ? <CreateReviewForm promptId={prompt.id} onCreated={handleReviewCreated} /> : null}
              <div className="flex flex-wrap gap-3">
                <Link href="/frameworks/new" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}>
                  Create framework
                </Link>
                <Link href="/models/new" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}>
                  Create model
                </Link>
                <Link href="/prompts/new" className={cn(buttonVariants({ size: "sm" }), "rounded-full")}>
                  Create another prompt
                </Link>
                <Link href="/categories/new" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}>
                  Create category
                </Link>
              </div>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
}