"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RegisterResult = {
  message?: string;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function RegisterForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submitRegistration(formData: FormData) {
    setPending(true);
    setError(null);
    setSuccess(null);

    const usernameValue = formData.get("username");
    const emailValue = formData.get("email");
    const passwordValue = formData.get("password");

    const username = typeof usernameValue === "string" ? usernameValue.trim() : "";
    const email = typeof emailValue === "string" ? emailValue.trim() : "";
    const password = typeof passwordValue === "string" ? passwordValue : "";

    try {
      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      const result = (await response.json().catch(() => null)) as RegisterResult | null;

      if (!response.ok) {
        setError(result?.message ?? "Registration failed.");
        return;
      }

      setSuccess(result?.message ?? "Registration successful.");
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

  return (
    <>
      <form
        className="grid gap-4"
        action={async (formData) => {
          await submitRegistration(formData);
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" name="username" placeholder="prompt-curator" disabled={pending} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="you@company.com" disabled={pending} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Minimum 8 characters"
            minLength={8}
            disabled={pending}
            required
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating account..." : "Create account"}
        </Button>
      </form>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      {success ? <p className="mt-4 text-sm text-primary">{success}</p> : null}
      <p className="mt-4 text-sm text-muted-foreground">
        Already registered? <Link href="/login" className="font-medium text-primary">Sign in</Link>.
      </p>
    </>
  );
}