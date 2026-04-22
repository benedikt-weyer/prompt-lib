"use client";

import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { apiUrl, fetchLlmModels } from "@/lib/api";
import type { CatalogLlmModel, CatalogReview } from "@/lib/types";

type CreateReviewResult = CatalogReview & {
  message?: string;
};

type CreateReviewFormProps = {
  promptId: number;
  onCreated: (review: CatalogReview) => void;
};

export function CreateReviewForm({ promptId, onCreated }: CreateReviewFormProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [models, setModels] = useState<CatalogLlmModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadModels() {
      try {
        const payload = await fetchLlmModels();
        if (!cancelled) {
          setModels(payload);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load models.");
        }
      } finally {
        if (!cancelled) {
          setLoadingModels(false);
        }
      }
    }

    void loadModels();

    return () => {
      cancelled = true;
    };
  }, []);

  async function submitReview(formData: FormData) {
    setPending(true);
    setError(null);

    const starsValue = formData.get("stars");
    const modelValue = formData.get("llmModelId");

    const stars = typeof starsValue === "string" ? Number(starsValue) : Number.NaN;
    const llmModelId = typeof modelValue === "string" ? Number(modelValue) : Number.NaN;

    try {
      const response = await fetch(`${apiUrl}/api/prompts/${promptId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          stars,
          llm_model_id: llmModelId,
        }),
      });

      const result = (await response.json().catch(() => null)) as CreateReviewResult | null;

      if (!response.ok) {
        setError(result?.message ?? "Review creation failed.");
        return;
      }

      if (result !== null) {
        onCreated(result);
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

  if (!loadingModels && models.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Create a <Link href="/frameworks/new" className="font-medium text-primary">framework</Link> and a <Link href="/models/new" className="font-medium text-primary">model</Link> before adding reviews.
      </p>
    );
  }

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
            defaultValue=""
          >
            <option value="" disabled>
              {loadingModels ? "Loading models..." : "Select a model"}
            </option>
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} · {model.thinking_effort} · {model.framework.name}
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
            defaultValue=""
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
        <Button type="submit" disabled={pending || authLoading || loadingModels}>
          {pending ? "Adding review..." : "Add review"}
        </Button>
      </form>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
    </>
  );
}