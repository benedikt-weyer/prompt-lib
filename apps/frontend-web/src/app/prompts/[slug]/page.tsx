"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth/auth-provider";
import { CreateReviewForm } from "@/components/reviews/create-review-form";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiUrl, fetchPromptBySlug, fetchReviews } from "@/lib/api";
import { getPromptExecutionTypeLabel } from "@/lib/prompt-execution-type";
import type { CatalogPrompt, CatalogReview } from "@/lib/types";
import { cn } from "@/lib/utils";

async function loadPromptData(slug: string) {
  const prompt = await fetchPromptBySlug(slug);

  if (prompt === null) {
    return { prompt, reviews: [] as CatalogReview[] };
  }

  const reviews = await fetchReviews(prompt.id);
  return { prompt, reviews };
}

function applyReviewsToPrompt(currentPrompt: CatalogPrompt | null, reviews: CatalogReview[]) {
  if (currentPrompt === null) {
    return currentPrompt;
  }

  if (reviews.length === 0) {
    return {
      ...currentPrompt,
      review_count: 0,
      average_stars: null,
    };
  }

  const totalStars = reviews.reduce((sum, review) => sum + review.stars, 0);

  return {
    ...currentPrompt,
    review_count: reviews.length,
    average_stars: Number((totalStars / reviews.length).toFixed(1)),
  };
}

async function updatePromptVisibility(prompt: CatalogPrompt) {
  const response = await fetch(`${apiUrl}/api/prompts/${prompt.id}/visibility`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      is_public: !prompt.is_public,
    }),
  });

  const payload = (await response.json().catch(() => null)) as CatalogPrompt | { message?: string } | null;

  if (!response.ok) {
    return {
      prompt: null,
      message: payload && "message" in payload ? payload.message ?? "Failed to update visibility." : "Failed to update visibility.",
    };
  }

  return {
    prompt: payload as CatalogPrompt,
    message: null,
  };
}

async function copyTextToClipboard(text: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    throw new TypeError("Clipboard is not available.");
  }

  await navigator.clipboard.writeText(text);
}

function getCopyButtonLabel(copied: boolean, copyPending: boolean) {
  if (copied) {
    return "Copied";
  }

  if (copyPending) {
    return "Copying";
  }

  return "Copy prompt";
}

function getVisibilityActionLabel(prompt: CatalogPrompt | null, visibilityPending: boolean) {
  if (visibilityPending) {
    return "Saving...";
  }

  if (prompt?.is_public) {
    return "Make private";
  }

  return "Make public";
}

function usePromptDetail(slug: string) {
  const [prompt, setPrompt] = useState<CatalogPrompt | null>(null);
  const [reviews, setReviews] = useState<CatalogReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibilityPending, setVisibilityPending] = useState(false);
  const [visibilityError, setVisibilityError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPrompt() {
      try {
        const payload = await loadPromptData(slug);

        if (!cancelled) {
          setPrompt(payload.prompt);
          setReviews(payload.reviews);
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
  }, [slug]);

  function handleReviewCreated(review: CatalogReview) {
    setReviews((currentReviews) => {
      const nextReviews = [review, ...currentReviews];
      setPrompt((currentPrompt) => applyReviewsToPrompt(currentPrompt, nextReviews));
      return nextReviews;
    });
  }

  function handleReviewUpdated(review: CatalogReview) {
    setReviews((currentReviews) => {
      const nextReviews = currentReviews.map((currentReview) =>
        currentReview.id === review.id ? review : currentReview,
      );
      setPrompt((currentPrompt) => applyReviewsToPrompt(currentPrompt, nextReviews));
      return nextReviews;
    });
  }

  function handleReviewDeleted(reviewId: number) {
    setReviews((currentReviews) => {
      const nextReviews = currentReviews.filter((review) => review.id !== reviewId);
      setPrompt((currentPrompt) => applyReviewsToPrompt(currentPrompt, nextReviews));
      return nextReviews;
    });
  }

  async function toggleVisibility() {
    if (prompt === null) {
      return;
    }

    setVisibilityPending(true);
    setVisibilityError(null);

    try {
      const result = await updatePromptVisibility(prompt);

      if (result.prompt === null) {
        setVisibilityError(result.message);
        return;
      }

      setPrompt(result.prompt);
    } catch {
      setVisibilityError("The API could not be reached. Confirm the backend is running and try again.");
    } finally {
      setVisibilityPending(false);
    }
  }

  return {
    prompt,
    reviews,
    loading,
    error,
    isMissing: !loading && error === null && prompt === null,
    visibilityPending,
    visibilityError,
    handleReviewCreated,
    handleReviewUpdated,
    handleReviewDeleted,
    toggleVisibility,
  };
}

function PromptMainSection({
  loading,
  error,
  isMissing,
  prompt,
  reviews,
  currentUserId,
  onReviewUpdated,
  onReviewDeleted,
}: Readonly<{
  loading: boolean;
  error: string | null;
  isMissing: boolean;
  prompt: CatalogPrompt | null;
  reviews: CatalogReview[];
  currentUserId: number | null;
  onReviewUpdated: (review: CatalogReview) => void;
  onReviewDeleted: (reviewId: number) => void;
}>) {
  const hasReviews = reviews.length > 0;
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [deletePendingId, setDeletePendingId] = useState<number | null>(null);
  const [reviewActionError, setReviewActionError] = useState<string | null>(null);

  async function deleteReview(review: CatalogReview) {
    if (prompt === null) {
      return;
    }

    if (!globalThis.confirm(`Delete your review for "${prompt.name}"?`)) {
      return;
    }

    setDeletePendingId(review.id);
    setReviewActionError(null);

    try {
      const response = await fetch(`${apiUrl}/api/prompts/${prompt.id}/reviews/${review.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        setReviewActionError(payload?.message ?? "Review deletion failed.");
        return;
      }

      onReviewDeleted(review.id);

      if (editingReviewId === review.id) {
        setEditingReviewId(null);
      }
    } catch {
      setReviewActionError("The API could not be reached. Confirm the backend is running and try again.");
    } finally {
      setDeletePendingId(null);
    }
  }

  return (
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
            {prompt.follow_up_prompts.length > 0 ? (
              <Badge variant="outline" className="rounded-full">{prompt.follow_up_prompts.length} follow-ups</Badge>
            ) : null}
            <Badge variant="outline" className="rounded-full">
              {getPromptExecutionTypeLabel(prompt.execution_type)}
            </Badge>
            <Badge variant="outline" className="rounded-full">{prompt.is_public ? "Public" : "Private"}</Badge>
            <Badge variant="outline" className="rounded-full">
              {prompt.average_stars === null ? "No ratings yet" : `Average ${prompt.average_stars} / 10`}
            </Badge>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight">{prompt.name}</h1>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
              Added by {prompt.author_name}. Reviews now persist against an LLM model, an independent framework, and a model-specific thinking effort.
            </p>
          </div>
          <PromptProposedImprovementsCard prompt={prompt} />
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Prompt body</CardTitle>
                <PromptCopyButton promptText={prompt.prompt} />
              </div>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-3xl bg-background/80 p-5 font-mono text-sm leading-7 text-foreground">
                {prompt.prompt}
              </pre>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle>Follow-up prompts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {prompt.follow_up_prompts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No follow-up prompts were defined for this prompt.
                </p>
              ) : (
                prompt.follow_up_prompts.map((followUpPrompt) => (
                  <div key={followUpPrompt.id} className="rounded-3xl border border-border/70 bg-background/70 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-foreground">Follow-up {followUpPrompt.position}</p>
                      <PromptCopyButton promptText={followUpPrompt.body} />
                    </div>
                    <pre className="overflow-x-auto whitespace-pre-wrap rounded-2xl bg-background/80 p-4 font-mono text-sm leading-7 text-foreground">
                      {followUpPrompt.body}
                    </pre>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle>Review runs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {reviewActionError ? <p className="text-sm text-destructive">{reviewActionError}</p> : null}
              {hasReviews ? (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div key={review.id} className="rounded-3xl border border-border/70 bg-background/70 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="rounded-full bg-secondary text-secondary-foreground">{review.stars} / 10</Badge>
                        <Badge variant="outline" className="rounded-full">{review.llm_model.name}</Badge>
                        <Badge variant="outline" className="rounded-full">{review.thinking_effort.name}</Badge>
                        <Badge variant="outline" className="rounded-full">{review.llm_framework.name}</Badge>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        Reviewed by {review.reviewer_name} on {new Date(review.created_at).toLocaleDateString()}.
                      </p>
                      {review.comment ? (
                        <div className="mt-3 rounded-2xl bg-background/80 px-4 py-3 text-sm leading-7 text-foreground/85">
                          <p className="mb-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">Comment</p>
                          <p className="whitespace-pre-wrap">{review.comment}</p>
                        </div>
                      ) : null}
                      {currentUserId === review.reviewer_id ? (
                        <div className="mt-4 flex flex-wrap gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setReviewActionError(null);
                              setEditingReviewId((currentEditingReviewId) =>
                                currentEditingReviewId === review.id ? null : review.id,
                              );
                            }}
                          >
                            {editingReviewId === review.id ? "Close editor" : "Edit review"}
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={async () => {
                              await deleteReview(review);
                            }}
                            disabled={deletePendingId === review.id}
                          >
                            {deletePendingId === review.id ? "Deleting..." : "Delete review"}
                          </Button>
                        </div>
                      ) : null}
                      {editingReviewId === review.id && prompt !== null ? (
                        <Card className="mt-4 border-border/70 bg-background/80" size="sm">
                          <CardHeader>
                            <CardTitle>Edit your review</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <CreateReviewForm
                              promptId={prompt.id}
                              initialReview={review}
                              onSaved={(updatedReview) => {
                                onReviewUpdated(updatedReview);
                                setEditingReviewId(null);
                              }}
                              onCancel={() => {
                                setEditingReviewId(null);
                              }}
                            />
                          </CardContent>
                        </Card>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No review runs yet. Add the first one with a model, thinking effort, and framework below.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </section>
  );
}

function PromptCopyButton({ promptText }: Readonly<{ promptText: string }>) {
  const [copyPending, setCopyPending] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeoutId = globalThis.setTimeout(() => {
      setCopied(false);
    }, 1800);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [copied]);

  async function handleCopyPrompt() {
    setCopyPending(true);
    setCopyError(null);

    try {
      await copyTextToClipboard(promptText);
      setCopied(true);
      toast.success("Prompt copied to clipboard.");
    } catch {
      setCopyError("Copy to clipboard failed.");
      toast.error("Copy to clipboard failed.");
    } finally {
      setCopyPending(false);
    }
  }

  const copyButtonLabel = getCopyButtonLabel(copied, copyPending);

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label={copyButtonLabel}
        title={copyButtonLabel}
        onClick={handleCopyPrompt}
        disabled={copyPending}
        className={"cursor-pointer"}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
      {copyError ? <p className="text-sm text-destructive">{copyError}</p> : null}
    </div>
  );
}

function PromptProposedImprovementsCard({ prompt }: Readonly<{ prompt: CatalogPrompt }>) {
  return (
    <Card className="border-border/70 bg-card/90">
      <CardHeader>
        <CardTitle>Proposed improvements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        {prompt.proposed_improvement_prompts.length === 0 ? (
          <p>No proposed improvement prompts are linked yet.</p>
        ) : (
          prompt.proposed_improvement_prompts.map((proposedImprovementPrompt) => (
            <div key={proposedImprovementPrompt.id} className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
              <Link href={`/prompts/${proposedImprovementPrompt.slug}`} className="font-medium text-primary">
                {proposedImprovementPrompt.name}
              </Link>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function PromptSidebar({
  prompt,
  isOwner,
  visibilityPending,
  visibilityError,
  onToggleVisibility,
  onDeletePrompt,
  deletePending,
  deleteError,
  onReviewCreated,
}: Readonly<{
  prompt: CatalogPrompt | null;
  isOwner: boolean;
  visibilityPending: boolean;
  visibilityError: string | null;
  onToggleVisibility: () => Promise<void>;
  onDeletePrompt: () => Promise<void>;
  deletePending: boolean;
  deleteError: string | null;
  onReviewCreated: (review: CatalogReview) => void;
}>) {
  const visibilityActionLabel = getVisibilityActionLabel(prompt, visibilityPending);

  return (
    <aside>
      <Card className="sticky top-24 border-border/70 bg-card/95 shadow-[0_30px_80px_-65px_var(--primary)]">
        <CardHeader>
          <CardTitle>Add review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
          {prompt && isOwner ? (
            <div className="rounded-3xl border border-border/70 bg-background/70 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-foreground">Visibility</p>
                  <p className="text-sm text-muted-foreground">
                    {prompt.is_public
                      ? "This prompt is visible on the public home page and to anonymous visitors."
                      : "This prompt is private and only visible to you."}
                  </p>
                </div>
                <Button type="button" variant="outline" onClick={onToggleVisibility} disabled={visibilityPending}>
                  {visibilityActionLabel}
                </Button>
              </div>
              {visibilityError ? <p className="mt-3 text-sm text-destructive">{visibilityError}</p> : null}
            </div>
          ) : null}
          {prompt && isOwner ? (
            <div className="flex flex-wrap gap-3">
              <Link href={`/prompts/${prompt.slug}/edit`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}>
                Edit prompt
              </Link>
              <Button type="button" variant="destructive" size="sm" onClick={onDeletePrompt} disabled={deletePending}>
                {deletePending ? "Deleting..." : "Delete prompt"}
              </Button>
            </div>
          ) : null}
          {deleteError ? <p className="text-sm text-destructive">{deleteError}</p> : null}
          {prompt ? <CreateReviewForm promptId={prompt.id} onSaved={onReviewCreated} /> : null}
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
            <Link href="/categories" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}>
              Open categories
            </Link>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}

export default function PromptDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const {
    prompt,
    reviews,
    loading,
    error,
    isMissing,
    visibilityPending,
    visibilityError,
    handleReviewCreated,
    handleReviewUpdated,
    handleReviewDeleted,
    toggleVisibility,
  } = usePromptDetail(params.slug);
  const isOwner = prompt !== null && user?.id === prompt.creator_id;
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function deletePrompt() {
    if (prompt === null) {
      return;
    }

    if (!globalThis.confirm(`Delete "${prompt.name}"? This also removes its reviews.`)) {
      return;
    }

    setDeletePending(true);
    setDeleteError(null);

    try {
      const response = await fetch(`${apiUrl}/api/prompts/${prompt.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        setDeleteError(payload?.message ?? "Prompt deletion failed.");
        return;
      }

      router.push("/prompts");
      router.refresh();
    } catch {
      setDeleteError("The API could not be reached. Confirm the backend is running and try again.");
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-16">
        <PromptMainSection
          loading={loading}
          error={error}
          isMissing={isMissing}
          prompt={prompt}
          reviews={reviews}
          currentUserId={user?.id ?? null}
          onReviewUpdated={handleReviewUpdated}
          onReviewDeleted={handleReviewDeleted}
        />
        <PromptSidebar
          prompt={prompt}
          isOwner={isOwner}
          visibilityPending={visibilityPending}
          visibilityError={visibilityError}
          onToggleVisibility={toggleVisibility}
          onDeletePrompt={deletePrompt}
          deletePending={deletePending}
          deleteError={deleteError}
          onReviewCreated={handleReviewCreated}
        />
      </main>
    </div>
  );
}