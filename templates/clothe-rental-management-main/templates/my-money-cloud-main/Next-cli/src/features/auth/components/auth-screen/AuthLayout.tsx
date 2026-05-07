import type { ReactNode } from "react";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { ThemeToggle } from "@/components/ui/theme-toggle";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  hint?: string | null;
  children: ReactNode;
};

export function AuthLayout({ title, subtitle, hint, children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen bg-gradient-background px-4 py-8">
      <div className="flex items-center justify-end gap-2 pb-4">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      <div className="mx-auto w-full max-w-xl rounded-3xl border border-border/60 bg-card/80 backdrop-blur-xl shadow-2d-lg">
        <div className="px-6 py-6 space-y-3 text-center">
          <h1 className="text-3xl font-extrabold">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <div className="px-6 pb-8">{children}</div>
      </div>
    </div>
  );
}
