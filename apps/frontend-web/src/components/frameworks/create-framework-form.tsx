"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiUrl } from "@/lib/api";
import type { CatalogLlmFramework } from "@/lib/types";

type CreateFrameworkResult = CatalogLlmFramework & {
  message?: string;
};

export function CreateFrameworkForm() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitFramework(formData: FormData) {
    setPending(true);
    setError(null);

    const nameValue = formData.get("name");
    const descriptionValue = formData.get("description");

    const name = typeof nameValue === "string" ? nameValue.trim() : "";
    const description = typeof descriptionValue === "string" ? descriptionValue.trim() : "";

    try {
      const response = await fetch(`${apiUrl}/api/llm-frameworks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name, description }),
      });

      const result = (await response.json().catch(() => null)) as CreateFrameworkResult | null;

      if (!response.ok) {
        setError(result?.message ?? "Framework creation failed.");
        return;
      }

      startTransition(() => {
        router.push("/models/new");
        router.refresh();
      });
    } catch {
      setError("The API could not be reached. Confirm the backend is running and try again.");
    } finally {
      setPending(false);
    }
  }

  if (!loading && !user) {
    return (
      <p className="text-sm text-muted-foreground">
        You need to <Link href="/login" className="font-medium text-primary">log in</Link> before creating frameworks.
      </p>
    );
  }

  return (
    <>
      <form
        className="grid gap-4"
        action={async (formData) => {
          await submitFramework(formData);
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="name">Framework name</Label>
          <Input id="name" name="name" placeholder="VS Code Copilot" disabled={pending} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            className="min-h-28"
            placeholder="Describe where this framework is used and what kind of runs it represents."
            disabled={pending}
          />
        </div>
        <Button type="submit" disabled={pending || loading}>
          {pending ? "Creating framework..." : "Create framework"}
        </Button>
      </form>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
    </>
  );
}