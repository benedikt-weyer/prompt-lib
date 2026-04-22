"use client";

import Link from "next/link";
import { startTransition, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiUrl, fetchLlmFrameworks, fetchLlmModels } from "@/lib/api";
import type { CatalogLlmFramework, CatalogLlmModel, CatalogReview } from "@/lib/types";

type CreateReviewResult = CatalogReview & {
  message?: string;
};

type CreateReviewFormProps = {
  promptId: number;
  onSaved: (review: CatalogReview) => void;
  initialReview?: CatalogReview;
  onCancel?: () => void;
};

function getInitialFieldValue(value: number | undefined) {
  return value === undefined ? "" : String(value);
}

function getInitialCommentValue(value: string | null | undefined) {
  return value ?? "";
}

function getReviewPrerequisiteMessage(models: CatalogLlmModel[], frameworks: CatalogLlmFramework[]) {
  if (models.length === 0 && frameworks.length === 0) {
    return (
      <>
        Create a <Link href="/models/new" className="font-medium text-primary">model</Link> and a <Link href="/frameworks/new" className="font-medium text-primary">framework</Link> before adding reviews.
      </>
    );
  }

  if (models.length === 0) {
    return (
      <>
        Create a <Link href="/models/new" className="font-medium text-primary">model</Link> before adding reviews.
      </>
    );
  }

  return (
    <>
      Create a <Link href="/frameworks/new" className="font-medium text-primary">framework</Link> before adding reviews.
    </>
  );
}

function getReviewSubmitLabel(pending: boolean, isEditing: boolean) {
  if (pending) {
    return isEditing ? "Saving review..." : "Adding review...";
  }

  return isEditing ? "Save review" : "Add review";
}

export function CreateReviewForm({
  promptId,
  onSaved,
  initialReview,
  onCancel,
}: Readonly<CreateReviewFormProps>) {
  const formKey = initialReview ? `review-${initialReview.id}` : `prompt-${promptId}`;

  return (
    <CreateReviewFormInner
      key={formKey}
      promptId={promptId}
      onSaved={onSaved}
      initialReview={initialReview}
      onCancel={onCancel}
    />
  );
}

function CreateReviewFormInner({
  promptId,
  onSaved,
  initialReview,
  onCancel,
}: Readonly<CreateReviewFormProps>) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [models, setModels] = useState<CatalogLlmModel[]>([]);
  const [frameworks, setFrameworks] = useState<CatalogLlmFramework[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [loadingFrameworks, setLoadingFrameworks] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string>(getInitialFieldValue(initialReview?.llm_model.id));
  const [selectedThinkingEffortId, setSelectedThinkingEffortId] = useState<string>(
    getInitialFieldValue(initialReview?.thinking_effort.id),
  );
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string>(
    getInitialFieldValue(initialReview?.llm_framework.id),
  );
  const [selectedStars, setSelectedStars] = useState<string>(getInitialFieldValue(initialReview?.stars));
  const [comment, setComment] = useState<string>(getInitialCommentValue(initialReview?.comment));

  useEffect(() => {
    let cancelled = false;

    async function loadMetadata() {
      try {
        const [loadedModels, loadedFrameworks] = await Promise.all([fetchLlmModels(), fetchLlmFrameworks()]);

        if (!cancelled) {
          setModels(loadedModels);
          setFrameworks(loadedFrameworks);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load review metadata.");
        }
      } finally {
        if (!cancelled) {
          setLoadingModels(false);
          setLoadingFrameworks(false);
        }
      }
    }

    void loadMetadata();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedModel = models.find((model) => String(model.id) === selectedModelId) ?? null;
  const availableThinkingEfforts = useMemo(
    () => selectedModel?.thinking_efforts ?? [],
    [selectedModel],
  );
  const effectiveThinkingEffortId = useMemo(() => {
    if (selectedModel === null) {
      return "";
    }

    return availableThinkingEfforts.some(
      (thinkingEffort) => String(thinkingEffort.id) === selectedThinkingEffortId,
    )
      ? selectedThinkingEffortId
      : "";
  }, [availableThinkingEfforts, selectedModel, selectedThinkingEffortId]);

  async function submitReview(formData: FormData) {
    setPending(true);
    setError(null);

    const starsValue = formData.get("stars");
    const modelValue = formData.get("llmModelId");
    const frameworkValue = formData.get("llmFrameworkId");
    const thinkingEffortValue = formData.get("thinkingEffortId");
    const commentValue = formData.get("comment");

    const stars = typeof starsValue === "string" ? Number(starsValue) : Number.NaN;
    const llmModelId = typeof modelValue === "string" ? Number(modelValue) : Number.NaN;
    const llmFrameworkId = typeof frameworkValue === "string" ? Number(frameworkValue) : Number.NaN;
    const thinkingEffortId = typeof thinkingEffortValue === "string" ? Number(thinkingEffortValue) : Number.NaN;
    const nextComment = typeof commentValue === "string" ? commentValue : "";

    try {
      const response = await fetch(
        initialReview
          ? `${apiUrl}/api/prompts/${promptId}/reviews/${initialReview.id}`
          : `${apiUrl}/api/prompts/${promptId}/reviews`,
        {
          method: initialReview ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            stars,
            comment: nextComment,
            llm_model_id: llmModelId,
            llm_framework_id: llmFrameworkId,
            llm_model_thinking_effort_id: thinkingEffortId,
          }),
        },
      );

      const result = (await response.json().catch(() => null)) as CreateReviewResult | null;

      if (!response.ok) {
        setError(result?.message ?? (initialReview ? "Review update failed." : "Review creation failed."));
        return;
      }

      if (result !== null) {
        onSaved(result);
      }

      if (!initialReview) {
        setSelectedModelId("");
        setSelectedThinkingEffortId("");
        setSelectedFrameworkId("");
        setSelectedStars("");
        setComment("");
      }

      startTransition(() => {
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
        You need to <Link href="/login" className="font-medium text-primary">log in</Link> before reviewing prompts.
      </p>
    );
  }

  if (!loadingModels && !loadingFrameworks && (models.length === 0 || frameworks.length === 0)) {
    return (
      <p className="text-sm text-muted-foreground">
        {getReviewPrerequisiteMessage(models, frameworks)}
      </p>
    );
  }
  const submitLabel = getReviewSubmitLabel(pending, initialReview !== undefined);

  return (
    <>
      <form
        className="grid gap-4"
        action={async (formData) => {
          await submitReview(formData);
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="llmModelId">LLM model</Label>
          <select
            id="llmModelId"
            name="llmModelId"
            disabled={pending || loadingModels}
            required
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
            value={selectedModelId}
            onChange={(event) => {
              setSelectedModelId(event.target.value);
            }}
          >
            <option value="" disabled>
              {loadingModels ? "Loading models..." : "Select a model"}
            </option>
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="thinkingEffortId">Thinking effort</Label>
          <select
            id="thinkingEffortId"
            name="thinkingEffortId"
            disabled={pending || loadingModels || selectedModel === null}
            required
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
            value={effectiveThinkingEffortId}
            onChange={(event) => {
              setSelectedThinkingEffortId(event.target.value);
            }}
          >
            <option value="" disabled>
              {selectedModel === null ? "Select a model first" : "Select a thinking effort"}
            </option>
            {availableThinkingEfforts.map((thinkingEffort) => (
              <option key={thinkingEffort.id} value={thinkingEffort.id}>
                {thinkingEffort.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="llmFrameworkId">Framework</Label>
          <select
            id="llmFrameworkId"
            name="llmFrameworkId"
            disabled={pending || loadingFrameworks}
            required
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
            value={selectedFrameworkId}
            onChange={(event) => {
              setSelectedFrameworkId(event.target.value);
            }}
          >
            <option value="" disabled>
              {loadingFrameworks ? "Loading frameworks..." : "Select a framework"}
            </option>
            {frameworks.map((framework) => (
              <option key={framework.id} value={framework.id}>
                {framework.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="stars">Stars</Label>
          <select
            id="stars"
            name="stars"
            disabled={pending}
            required
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
            value={selectedStars}
            onChange={(event) => {
              setSelectedStars(event.target.value);
            }}
          >
            <option value="" disabled>
              Select a score
            </option>
            {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
              <option key={value} value={value}>
                {value} / 10
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="comment">Comment</Label>
          <Textarea
            id="comment"
            name="comment"
            value={comment}
            onChange={(event) => {
              setComment(event.target.value);
            }}
            disabled={pending}
            className="min-h-28"
            placeholder="Summarize what worked, what failed, and any caveats from this review run."
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={pending || authLoading || loadingModels || loadingFrameworks}>
            {submitLabel}
          </Button>
          {initialReview && onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
    </>
  );
}