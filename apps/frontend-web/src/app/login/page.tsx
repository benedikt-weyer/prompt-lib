import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-10 lg:px-8 lg:py-16">
        <div className="grid w-full gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">Login</p>
            <h1 className="text-4xl font-semibold tracking-tight">Sign in to manage prompt runs and review history.</h1>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground">
              Sign in uses the same JWT cookie flow as registration, so successful login immediately restores an authenticated browser session.
            </p>
          </div>
          <Card className="border-border/70 bg-card/95">
            <CardHeader>
              <CardTitle>Welcome back</CardTitle>
            </CardHeader>
            <CardContent>
              <LoginForm />
              <p className="mt-4 text-sm text-muted-foreground">
                Need an account? <Link href="/register" className="font-medium text-primary">Register here</Link>.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}