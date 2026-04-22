import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
              JWT session handling is the next backend milestone. This page already reflects the intended browser flow and field set.
            </p>
          </div>
          <Card className="border-border/70 bg-card/95">
            <CardHeader>
              <CardTitle>Welcome back</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@company.com" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••" />
                </div>
                <Button type="submit">JWT login wiring next</Button>
              </form>
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