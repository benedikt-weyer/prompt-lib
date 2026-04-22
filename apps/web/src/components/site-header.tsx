import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/prompts", label: "Prompts" },
  { href: "/login", label: "Login" },
  { href: "/register", label: "Register" },
];

export function SiteHeader() {
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
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-full")}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}