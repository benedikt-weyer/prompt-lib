import { CreatePromptForm } from "@/components/prompts/create-prompt-form";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewPromptPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10 lg:px-8 lg:py-16">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">Prompts</p>
          <h1 className="text-4xl font-semibold tracking-tight">Create a prompt</h1>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
            Pick a category, write the prompt body, and store it as a real catalog record tied to your account.
          </p>
        </div>
        <Card className="border-border/70 bg-card/95">
          <CardHeader>
            <CardTitle>New prompt</CardTitle>
          </CardHeader>
          <CardContent>
            <CreatePromptForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}