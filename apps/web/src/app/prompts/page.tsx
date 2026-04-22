import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { averageStars, prompts } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function PromptsPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 lg:px-8 lg:py-16">
        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">Library</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Prompt records with review runs attached</h1>
          </div>
          <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "rounded-full")}>Join and add prompts</Link>
        </section>
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {prompts.map((prompt) => (
            <Card key={prompt.id} className="border-border/70 bg-card/90">
              <CardHeader className="gap-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className="rounded-full bg-secondary text-secondary-foreground">{prompt.category.name}</Badge>
                  <Badge variant="outline" className="rounded-full">{prompt.reviews.length} reviews</Badge>
                </div>
                <CardTitle className="text-2xl">{prompt.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="line-clamp-5 text-sm leading-7 text-muted-foreground">{prompt.prompt}</p>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Average</span>
                  <span className="font-medium text-foreground">{averageStars(prompt)} / 10</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {prompt.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="rounded-full">{tag}</Badge>
                  ))}
                </div>
                <Link href={`/prompts/${prompt.slug}`} className={cn(buttonVariants({ variant: "outline" }), "w-full rounded-full")}>Inspect reviews</Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}