import { Link, useLocation } from "@tanstack/react-router";
import { Mic2, Film, FolderOpen, Youtube, Languages, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Tạo giọng đọc", icon: Mic2 },
  { to: "/video", label: "Tạo Video", icon: Film },
  { to: "/resources", label: "Tài nguyên", icon: FolderOpen },
  { to: "/youtube", label: "Đăng YouTube", icon: Youtube },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl sticky top-0 h-screen">
        <div className="px-5 py-5 flex items-center gap-3 border-b border-sidebar-border">
          <div className="size-10 rounded-xl btn-primary-grad grid place-items-center font-display font-bold text-lg">
            P
          </div>
          <div className="leading-tight">
            <div className="font-display font-semibold">Xưởng Piper</div>
            <div className="text-xs text-muted-foreground">Studio nội bộ</div>
          </div>
        </div>
        <nav className="p-3 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50",
                )}
              >
                <Icon className="size-4" />
                <span className="font-medium">{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto p-4">
          <div className="surface-card p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="size-4 text-primary-glow" />
              Piper sẵn sàng
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Máy chủ TTS & dựng video đang hoạt động.
            </p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4 px-4 md:px-8 h-16">
            <div className="md:hidden flex items-center gap-2">
              <div className="size-8 rounded-lg btn-primary-grad grid place-items-center font-bold">P</div>
              <span className="font-display font-semibold">Xưởng Piper</span>
            </div>
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              <span className="size-2 rounded-full bg-success animate-pulse" />
              Hệ thống ổn định
            </div>
            <div className="flex items-center gap-2">
              <button className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:bg-accent transition-colors">
                <Languages className="size-4" />
                Tiếng Việt
              </button>
              <div className="size-9 rounded-full btn-primary-grad grid place-items-center text-sm font-semibold">
                P
              </div>
            </div>
          </div>
          {/* Mobile nav */}
          <nav className="md:hidden flex gap-1 overflow-x-auto px-3 pb-3">
            {nav.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-xs whitespace-nowrap",
                    active ? "bg-accent text-foreground" : "text-muted-foreground",
                  )}
                >
                  <Icon className="size-3.5" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="flex-1 px-4 md:px-8 py-6 md:py-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
}: {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight">{title}</h1>
          {badge}
        </div>
        {description && (
          <p className="mt-2 text-muted-foreground max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
