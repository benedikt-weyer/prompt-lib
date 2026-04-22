"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  let navActions: React.ReactNode;

  if (loading) {
    navActions = <span className="px-3 text-sm text-muted-foreground">Checking session...</span>;
  } else if (user) {
    navActions = (
      <>
        <Link
          href="/categories"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-full")}
        >
          Categories
        </Link>
        <Link
          href="/prompts/new"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-full")}
        >
          New prompt
        </Link>
        <span className="px-3 text-sm text-muted-foreground">Hi, {user.username}</span>
        <button
          type="button"
          onClick={() => {
            void handleLogout();
          }}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}
        >
          Logout
        </button>
      </>
    );
  } else {
    navActions = (
      <>
        <Link
          href="/login"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-full")}
        >
          Login
        </Link>
        <Link
          href="/register"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-full")}
        >
          Register
        </Link>
      </>
    );
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_18px_50px_-28px_var(--primary)]">
            <span className="font-mono text-sm uppercase tracking-[0.25em]">PL</span>
          </div>
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-muted-foreground">
              Prompt Lib
            </p>
            <p className="text-sm text-foreground/80">
              LLM prompt catalog with review metadata.
            </p>
          </div>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/prompts"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-full")}
          >
            Prompts
          </Link>
          <Link
            href="/llm-config"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-full")}
          >
            LLM config
          </Link>
          {navActions}
        </nav>
      </div>
    </header>
  );
}