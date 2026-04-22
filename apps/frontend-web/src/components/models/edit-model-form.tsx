"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiUrl } from "@/lib/api";
import type { CatalogLlmModel, CatalogLlmModelThinkingEffort } from "@/lib/types";

type UpdateModelResult = CatalogLlmModel & {
  message?: string;
};

type CreateThinkingEffortResult = CatalogLlmModelThinkingEffort & {
  message?: string;
};

type EditModelFormProps = {
  initialModel: CatalogLlmModel;
};

function sortThinkingEfforts(efforts: CatalogLlmModelThinkingEffort[]) {
  return [...efforts].sort((left, right) => {
    if (left.is_default !== right.is_default) {
      return left.is_default ? -1 : 1;
    }

    return left.name.localeCompare(right.name);
  });
}

export function EditModelForm({ initialModel }: Readonly<EditModelFormProps>) {
  const router = useRouter();
  const [model, setModel] = useState(initialModel);
  const [name, setName] = useState(initialModel.name);
  const [newThinkingEffortName, setNewThinkingEffortName] = useState("");
  const [savePending, setSavePending] = useState(false);
  const [addPending, setAddPending] = useState(false);
  const [deletePendingId, setDeletePendingId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [thinkingEffortError, setThinkingEffortError] = useState<string | null>(null);

  const thinkingEfforts = useMemo(() => sortThinkingEfforts(model.thinking_efforts), [model.thinking_efforts]);

  async function submitModelUpdate(formData: FormData) {
    setSavePending(true);
    setSaveError(null);

    const nextNameValue = formData.get("name");
    const nextName = typeof nextNameValue === "string" ? nextNameValue.trim() : "";

    try {
      const response = await fetch(`${apiUrl}/api/llm-models/${model.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: nextName,
        }),
      });

      const result = (await response.json().catch(() => null)) as UpdateModelResult | null;

      if (!response.ok) {
        setSaveError(result?.message ?? "Model update failed.");
        return;
      }

      if (result === null) {
        setSaveError("Model update failed.");
        return;
      }

      setModel(result);
      setName(result.name);

      startTransition(() => {
        router.push(`/models/${result.slug}/edit`);
        router.refresh();
      });
    } catch {
      setSaveError("The API could not be reached. Confirm the backend is running and try again.");
    } finally {
      setSavePending(false);
    }
  }

  async function submitThinkingEffort(formData: FormData) {
    setAddPending(true);
    setThinkingEffortError(null);

    const effortNameValue = formData.get("thinkingEffortName");
    const effortName = typeof effortNameValue === "string" ? effortNameValue.trim() : "";

    try {
      const response = await fetch(`${apiUrl}/api/llm-models/${model.id}/thinking-efforts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: effortName,
        }),
      });

      const result = (await response.json().catch(() => null)) as CreateThinkingEffortResult | null;

      if (!response.ok) {
        setThinkingEffortError(result?.message ?? "Thinking effort creation failed.");
        return;
      }

      if (result === null) {
        setThinkingEffortError("Thinking effort creation failed.");
        return;
      }

      setModel((currentModel) => ({
        ...currentModel,
        thinking_efforts: sortThinkingEfforts([...currentModel.thinking_efforts, result]),
      }));
      setNewThinkingEffortName("");
      router.refresh();
    } catch {
      setThinkingEffortError("The API could not be reached. Confirm the backend is running and try again.");
    } finally {
      setAddPending(false);
    }
  }

  async function deleteThinkingEffort(thinkingEffortId: number) {
    setDeletePendingId(thinkingEffortId);
    setThinkingEffortError(null);

    try {
      const response = await fetch(`${apiUrl}/api/llm-models/${model.id}/thinking-efforts/${thinkingEffortId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        setThinkingEffortError(payload?.message ?? "Thinking effort deletion failed.");
        return;
      }

      setModel((currentModel) => ({
        ...currentModel,
        thinking_efforts: currentModel.thinking_efforts.filter((effort) => effort.id !== thinkingEffortId),
      }));
      router.refresh();
    } catch {
      setThinkingEffortError("The API could not be reached. Confirm the backend is running and try again.");
    } finally {
      setDeletePendingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <form
        className="grid gap-4"
        action={async (formData) => {
          await submitModelUpdate(formData);
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="name">Model name</Label>
          <Input
            id="name"
            name="name"
            value={name}
            placeholder="GPT-5.4"
            disabled={savePending}
            required
            onChange={(event) => {
              setName(event.target.value);
            }}
          />
        </div>
        <Button type="submit" disabled={savePending}>
          {savePending ? "Saving model..." : "Save model"}
        </Button>
        {saveError ? <p className="text-sm text-destructive">{saveError}</p> : null}
      </form>

      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-lg font-medium text-foreground">Thinking efforts</h2>
          <p className="text-sm text-muted-foreground">
            Every model always has the default efforts unknown and none. Add any extra effort labels here and they will be available during review creation.
          </p>
        </div>

        <div className="space-y-3">
          {thinkingEfforts.map((thinkingEffort) => (
            <div
              key={thinkingEffort.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-background/70 px-4 py-3"
            >
              <div>
                <p className="font-medium text-foreground">{thinkingEffort.name}</p>
                <p className="text-sm text-muted-foreground">Slug: {thinkingEffort.slug}</p>
              </div>
              {thinkingEffort.is_default ? (
                <span className="text-sm text-muted-foreground">Default</span>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={deletePendingId === thinkingEffort.id}
                  onClick={async () => {
                    await deleteThinkingEffort(thinkingEffort.id);
                  }}
                >
                  {deletePendingId === thinkingEffort.id ? "Removing..." : "Remove"}
                </Button>
              )}
            </div>
          ))}
        </div>

        <form
          className="grid gap-4 rounded-2xl border border-border/70 bg-background/70 p-4"
          action={async (formData) => {
            await submitThinkingEffort(formData);
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="thinkingEffortName">Add thinking effort</Label>
            <Input
              id="thinkingEffortName"
              name="thinkingEffortName"
              value={newThinkingEffortName}
              placeholder="deep research"
              disabled={addPending}
              required
              onChange={(event) => {
                setNewThinkingEffortName(event.target.value);
              }}
            />
          </div>
          <Button type="submit" disabled={addPending}>
            {addPending ? "Adding effort..." : "Add thinking effort"}
          </Button>
          {thinkingEffortError ? <p className="text-sm text-destructive">{thinkingEffortError}</p> : null}
        </form>
      </section>
    </div>
  );
}