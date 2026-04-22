import { CreateCategoryForm } from "@/components/categories/create-category-form";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewCategoryPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10 lg:px-8 lg:py-16">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">Categories</p>
          <h1 className="text-4xl font-semibold tracking-tight">Create a category</h1>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
            Categories can now be nested. Main categories have no parent category, and subcategories sit beneath the parent you select.
          </p>
        </div>
        <Card className="border-border/70 bg-card/95">
          <CardHeader>
            <CardTitle>New category</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateCategoryForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}