import { RegisterForm } from "@/components/auth/register-form";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
              <RegisterForm />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}