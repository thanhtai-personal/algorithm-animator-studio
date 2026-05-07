import type { ReactNode } from "react";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  hint?: string | null;
  children: ReactNode;
};

export function AuthLayout({ title, subtitle, hint, children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-[100dvh] bg-gradient-background px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,theme(colors.primary/15),transparent_45%),radial-gradient(circle_at_bottom_right,theme(colors.accent/45),transparent_55%)]" />
      <div className="relative mx-auto grid w-full max-w-5xl gap-4 lg:grid-cols-[1.05fr,1fr]">
        <aside className="hidden rounded-3xl border border-border/60 bg-card/85 p-7 shadow-md backdrop-blur lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="inline-flex rounded-full border border-border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              KATA Auth
            </p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground">{title}</h1>
            <p className="mt-3 text-sm text-muted-foreground">{subtitle}</p>
          </div>

          {hint ? (
            <p className="rounded-2xl border border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
              {hint}
            </p>
          ) : null}
        </aside>

        <section className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl border border-border/60 bg-card/90 p-6 shadow-xl backdrop-blur md:max-h-none md:overflow-visible md:p-7">
          <div className="space-y-2 text-center lg:hidden">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
            {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
          </div>

          <div className="mt-6 lg:mt-0">{children}</div>
        </section>
      </div>
    </div>
  );
}
