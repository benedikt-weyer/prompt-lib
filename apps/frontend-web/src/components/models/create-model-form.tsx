"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiUrl } from "@/lib/api";
import type { CatalogLlmModel } from "@/lib/types";

type CreateModelResult = CatalogLlmModel & {
  message?: string;
};

export function CreateModelForm() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitModel(formData: FormData) {
    setPending(true);
    setError(null);

    const nameValue = formData.get("name");
    const name = typeof nameValue === "string" ? nameValue.trim() : "";

    try {
      const response = await fetch(`${apiUrl}/api/llm-models`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name,
        }),
      });

      const result = (await response.json().catch(() => null)) as CreateModelResult | null;

      if (!response.ok) {
        setError(result?.message ?? "Model creation failed.");
        return;
      }

      if (result === null) {
        setError("Model creation failed.");
        return;
      }

      startTransition(() => {
        router.push(`/models/${result.slug}/edit`);
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
        <p className="text-sm text-muted-foreground">
          Frameworks are selected when you create reviews. New models start with the default thinking efforts <span className="font-medium text-foreground">unknown</span> and <span className="font-medium text-foreground">none</span>, and you can add more in model edit.
        </p>
        <Button type="submit" disabled={pending || authLoading}>
          {pending ? "Creating model..." : "Create model"}
        </Button>
      </form>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
    </>
  );
}