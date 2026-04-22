import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-10 lg:px-8 lg:py-16">
        <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-5">
            <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">Register</p>
            <h1 className="text-4xl font-semibold tracking-tight">Create an account and start curating prompt evidence.</h1>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground">
              Registration will be backed by Axum, SeaORM, password hashing, and JWT cookies. The form is in place so the API integration can plug in directly.
            </p>
          </div>
          <Card className="border-border/70 bg-card/95">
            <CardHeader>
              <CardTitle>Create your workspace identity</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" placeholder="prompt-curator" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@company.com" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="Minimum 8 characters" />
                </div>
                <Button type="submit">Registration wiring next</Button>
              </form>
              <p className="mt-4 text-sm text-muted-foreground">
                Already registered? <Link href="/login" className="font-medium text-primary">Sign in</Link>.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}