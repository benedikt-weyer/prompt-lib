import { notFound } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { averageStars, getPromptBySlug } from "@/lib/mock-data";

type PromptDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PromptDetailPage({ params }: Readonly<PromptDetailPageProps>) {
  const { slug } = await params;
  const prompt = getPromptBySlug(slug);

  if (!prompt) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-16">
        <section className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge className="rounded-full bg-secondary text-secondary-foreground">{prompt.category.name}</Badge>
            <Badge variant="outline" className="rounded-full">{prompt.reviews.length} review runs</Badge>
            <Badge variant="outline" className="rounded-full">Average {averageStars(prompt)} / 10</Badge>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight">{prompt.name}</h1>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
              Added by {prompt.authorName}. This detail view is wired to the review-centric data model, so every review keeps the model name, effort level, and framework it was tested in.
            </p>
          </div>
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle>Prompt body</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-3xl bg-background/80 p-5 font-mono text-sm leading-7 text-foreground">
                {prompt.prompt}
              </pre>
            </CardContent>
          </Card>
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">Review runs</h2>
            <div className="grid gap-4">
              {prompt.reviews.map((review) => (
                <Card key={review.id} className="border-border/70 bg-card/90">
                  <CardHeader className="gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                      <div className="flex flex-wrap gap-2">
                        <Badge className="rounded-full bg-primary/10 text-primary">{review.stars} / 10</Badge>
                        <Badge variant="outline" className="rounded-full">{review.llmModelName}</Badge>
                        <Badge variant="outline" className="rounded-full">{review.thinkingEffort}</Badge>
                        <Badge variant="outline" className="rounded-full">{review.llmFramework}</Badge>
                      </div>
                      <span className="text-muted-foreground">{review.createdAt}</span>
                    </div>
                    <CardTitle className="text-lg">Reviewed by {review.authorName}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm leading-7 text-muted-foreground">
                    {review.notes}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        <aside>
          <Card className="sticky top-24 border-border/70 bg-card/95 shadow-[0_30px_80px_-65px_var(--primary)]">
            <CardHeader>
              <CardTitle>Add review run</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="stars">Stars</Label>
                  <Input id="stars" type="number" min={1} max={10} defaultValue={8} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="model-name">LLM model name</Label>
                  <Input id="model-name" defaultValue="GPT-5.4" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="thinking-effort">Thinking effort</Label>
                  <Select defaultValue="high">
                    <SelectTrigger id="thinking-effort">
                      <SelectValue placeholder="Select effort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="framework">LLM framework</Label>
                  <Input id="framework" defaultValue="VS Code Copilot" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Review notes</Label>
                  <Textarea
                    id="notes"
                    defaultValue="The API route exists in the backend scaffold. Next milestone is wiring this form to persisted review creation."
                    className="min-h-32"
                  />
                </div>
                <Button type="submit">Review submission wiring next</Button>
              </form>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
}