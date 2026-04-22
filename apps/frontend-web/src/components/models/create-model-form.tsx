"use client";

import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiUrl, fetchLlmFrameworks } from "@/lib/api";
import type { CatalogLlmFramework, CatalogLlmModel, ThinkingEffort } from "@/lib/types";

type CreateModelResult = CatalogLlmModel & {
  message?: string;
};

const thinkingEffortOptions: ThinkingEffort[] = ["low", "medium", "high"];

export function CreateModelForm() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [frameworks, setFrameworks] = useState<CatalogLlmFramework[]>([]);
  const [loadingFrameworks, setLoadingFrameworks] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFrameworks() {
      try {
        const payload = await fetchLlmFrameworks();
        if (!cancelled) {
          setFrameworks(payload);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load frameworks.");
        }
      } finally {
        if (!cancelled) {
          setLoadingFrameworks(false);
        }
      }
    }

    void loadFrameworks();

    return () => {
      cancelled = true;
    };
  }, []);

  async function submitModel(formData: FormData) {
    setPending(true);
    setError(null);

    const nameValue = formData.get("name");
    const frameworkValue = formData.get("frameworkId");
    const thinkingEffortValue = formData.get("thinkingEffort");

    const name = typeof nameValue === "string" ? nameValue.trim() : "";
    const frameworkId = typeof frameworkValue === "string" ? Number(frameworkValue) : Number.NaN;
    const thinkingEffort =
      thinkingEffortValue === "low" || thinkingEffortValue === "medium" || thinkingEffortValue === "high"
        ? thinkingEffortValue
        : null;

    if (thinkingEffort === null) {
      setError("Select a valid thinking effort.");
      setPending(false);
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/llm-models`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name,
          framework_id: frameworkId,
          thinking_effort: thinkingEffort,
        }),
      });

      const result = (await response.json().catch(() => null)) as CreateModelResult | null;

      if (!response.ok) {
        setError(result?.message ?? "Model creation failed.");
        return;
      }

      startTransition(() => {
        router.push("/prompts");
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
        You need to <Link href="/login" className="font-medium text-primary">log in</Link> before creating models.
      </p>
    );
  }

  if (!loadingFrameworks && frameworks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Create a <Link href="/frameworks/new" className="font-medium text-primary">framework</Link> first so the model can belong to it.
      </p>
    );
  }

  return (
    <>
      <form
        className="grid gap-4"
        action={async (formData) => {
          await submitModel(formData);
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="name">Model name</Label>
          <Input id="name" name="name" placeholder="GPT-5.4" disabled={pending} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="frameworkId">Framework</Label>
          <select
            id="frameworkId"
            name="frameworkId"
            disabled={pending || loadingFrameworks}
            required
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
            defaultValue=""
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
          <Label htmlFor="thinkingEffort">Thinking effort</Label>
          <select
            id="thinkingEffort"
            name="thinkingEffort"
            disabled={pending}
            required
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
            defaultValue=""
          >
            <option value="" disabled>
              Select a thinking effort
            </option>
            {thinkingEffortOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={pending || authLoading || loadingFrameworks}>
          {pending ? "Creating model..." : "Create model"}
        </Button>
      </form>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
    </>
  );
}