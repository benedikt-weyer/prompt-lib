"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthUser } from "@/lib/types";

type LoginResult = {
  message?: string;
  user?: AuthUser;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function LoginForm() {
  const router = useRouter();
  const { setAuthenticatedUser } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitLogin(formData: FormData) {
    setPending(true);
    setError(null);

    const emailValue = formData.get("email");
    const passwordValue = formData.get("password");

    const email = typeof emailValue === "string" ? emailValue.trim() : "";
    const password = typeof passwordValue === "string" ? passwordValue : "";

    try {
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const result = (await response.json().catch(() => null)) as LoginResult | null;

      if (!response.ok) {
        setError(result?.message ?? "Login failed.");
        return;
      }

      setAuthenticatedUser(result?.user ?? null);

      startTransition(() => {
        router.push("/");
        router.refresh();
      });
    } catch {
      setError("The API could not be reached. Confirm the backend is running and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <form
        className="grid gap-4"
        action={async (formData) => {
          await submitLogin(formData);
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="you@company.com" disabled={pending} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" placeholder="••••••••" disabled={pending} required />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Signing in..." : "Sign in"}
        </Button>
      </form>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
    </>
  );
}