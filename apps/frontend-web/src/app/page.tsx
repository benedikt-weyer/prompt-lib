"use client";

import Link from "next/link";

import { useAuth } from "@/components/auth/auth-provider";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { averageStars, categories, prompts } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function Home() {
  const { user, loading } = useAuth();
  const totalReviews = prompts.reduce((count, prompt) => count + prompt.reviews.length, 0);

  if (!loading && user) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10 lg:px-8 lg:py-16">
          <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <Card className="border-border/70 bg-card/95 shadow-[0_30px_120px_-70px_var(--primary)]">
              <CardHeader className="gap-3">
                <Badge className="w-fit rounded-full bg-secondary px-4 py-1 text-secondary-foreground">
                  Dashboard
                </Badge>
                <CardTitle className="text-4xl">Welcome back, {user.username}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
                <p>
                  Your browser session is active. From here you can browse prompts, review model runs,
                  and start adding real categories and prompts once the remaining CRUD endpoints are wired.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/prompts" className={cn(buttonVariants({ size: "lg" }), "rounded-full px-6")}>
                    Open prompt library
                  </Link>
                  <Link href="/categories/new" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full px-6")}>
                    Create category
                  </Link>
                  <Link href="/prompts/new" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full px-6")}>
                    Create prompt
                  </Link>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/70 bg-card/95">
              <CardHeader>
                <CardTitle className="text-xl">Session summary</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                <Metric label="Signed In As" value={user.username} />
                <Metric label="Catalog Prompts" value={String(prompts.length)} />
                <Metric label="Review Runs" value={String(totalReviews)} />
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-5 md:grid-cols-3">
            {categories.map((category) => (
              <Card key={category.id} className="border-border/70 bg-card/90">
                <CardHeader className="gap-2">
                  <Badge variant="secondary" className="w-fit rounded-full">{category.promptCount} prompts</Badge>
                  <CardTitle>{category.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-7 text-muted-foreground">
                  {category.description}
                </CardContent>
              </Card>
            ))}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-10 lg:px-8 lg:py-16">
        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-6">
            <Badge className="rounded-full bg-secondary px-4 py-1 text-secondary-foreground">
              Review prompts by model, effort, and framework
            </Badge>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
                Build a prompt library that remembers which model actually performed.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                Prompt Lib stores prompts, categories, and review runs together so teams can compare
                how the same prompt behaves in VS Code Copilot, Claude, Playground tools, and other LLM workflows.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/prompts" className={cn(buttonVariants({ size: "lg" }), "rounded-full px-6")}>Browse prompts</Link>
              <Link href="/register" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full px-6")}>Create account</Link>
            </div>
          </div>
          <Card className="border-border/70 bg-card/95 shadow-[0_30px_120px_-70px_var(--primary)]">
            <CardHeader>
              <CardTitle className="text-xl">Current prototype snapshot</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <Metric label="Categories" value={String(categories.length)} />
              <Metric label="Prompts" value={String(prompts.length)} />
              <Metric label="Reviews" value={String(totalReviews)} />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id} className="border-border/70 bg-card/90">
              <CardHeader className="gap-2">
                <Badge variant="secondary" className="w-fit rounded-full">{category.promptCount} prompts</Badge>
                <CardTitle>{category.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-7 text-muted-foreground">
                {category.description}
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">Featured prompts</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Structured prompts with real review trails</h2>
            </div>
            <Link href="/prompts" className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}>Open library</Link>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {prompts.map((prompt) => (
              <Card key={prompt.id} className="flex h-full flex-col border-border/70 bg-card/90">
                <CardHeader className="gap-4">
                  <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
                    <span>{prompt.category.name}</span>
                    <span>{averageStars(prompt)} / 10</span>
                  </div>
                  <CardTitle className="text-2xl">{prompt.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <p className="line-clamp-4 text-sm leading-7 text-muted-foreground">{prompt.prompt}</p>
                  <div className="mt-auto flex flex-wrap gap-2">
                    {prompt.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="rounded-full">{tag}</Badge>
                    ))}
                  </div>
                  <Link href={`/prompts/${prompt.slug}`} className={cn(buttonVariants({ variant: "secondary" }), "mt-3 rounded-full")}>View prompt</Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-3xl border border-border/70 bg-background/70 p-5">
      <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
      <p className="mt-3 text-4xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
