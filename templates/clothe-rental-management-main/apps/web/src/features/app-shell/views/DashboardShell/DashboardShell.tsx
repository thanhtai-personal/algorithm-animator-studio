"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { observer } from "mobx-react-lite";
import {
  BarChart3,
  Brush,
  CalendarDays,
  Clock3,
  ChevronDown,
  CreditCard,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PackagePlus,
  Search,
  Settings,
  ShoppingBag,
  Users,
  Warehouse,
  X,
  type LucideIcon,
} from "lucide-react";
import { PaletteSelect } from "@/components/theme/PaletteSelect";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import type { DashboardNavKey } from "@/features/app-shell/constants";
import { useDashboardShell } from "@/features/app-shell/hooks/useDashboardShell";
import { NotificationsCenter } from "@/features/notifications/components/NotificationsCenter";
import { PwaInstallButton } from "@/features/pwa/components/PwaInstallButton";

interface DashboardShellProps {
  children: ReactNode;
}

const NAV_ICON_MAP: Record<DashboardNavKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  orders: ShoppingBag,
  inventory: Warehouse,
  products: Package,
  procurement: PackagePlus,
  media: Images,
  categories: Package,
  customers: Users,
  shifts: Clock3,
  payments: CreditCard,
  calendar: CalendarDays,
  makeup: Brush,
  reports: BarChart3,
  settings: Settings,
};

export const DashboardShell = observer(function DashboardShell({
  children,
}: DashboardShellProps) {
  const {
    currentLocale,
    copy,
    showGlobalBranchSelector,
    navItems,
    activeNavLabel,
    branchOptions,
    currentBranchId,
    role,
    siteLogoUrl,
    userLabel,
    roleLabel,
    setCurrentBranch,
    switchLocale,
    handleSignOut,
  } = useDashboardShell();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const previousOverflow = document.body.style.overflow;
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  const userInitial = useMemo(() => {
    const normalized = userLabel.trim();
    if (!normalized) return "U";
    return normalized[0]?.toUpperCase() ?? "U";
  }, [userLabel]);

  const resolvedBranchIdForQuickLinks = currentBranchId ?? branchOptions[0]?.value ?? null;
  const isSuperAdmin = role === "owner_admin";

  const openSalesHref = resolvedBranchIdForQuickLinks
    ? `/${currentLocale}/sales/pos?branchId=${encodeURIComponent(resolvedBranchIdForQuickLinks)}`
    : `/${currentLocale}/sales/pos`;
  const openProductHref = isSuperAdmin
    ? `/${currentLocale}/product`
    : resolvedBranchIdForQuickLinks
    ? `/${currentLocale}/product?branchId=${encodeURIComponent(resolvedBranchIdForQuickLinks)}`
    : `/${currentLocale}/product`;

  const desktopSidebarWidthClass = collapsed ? "md:w-16" : "md:w-64";
  const showSidebarLabel = !collapsed || mobileOpen;

  return (
    <div className="flex min-h-screen bg-background">
      {mobileOpen ? (
        <button
          type="button"
          aria-label={copy.closeMenuAriaLabel}
          className="fixed inset-0 z-40 bg-foreground/20 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-all duration-300 md:sticky md:top-0 md:h-screen md:translate-x-0 ${desktopSidebarWidthClass} ${
          mobileOpen ? "translate-x-0 shadow-xl" : "-translate-x-full md:shadow-none"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          {showSidebarLabel ? (
            <div>
              {siteLogoUrl ? (
                <img
                  src={siteLogoUrl}
                  alt={copy.brandSubtitle}
                  width={140}
                  height={20}
                  className="mb-1 h-5 w-auto max-w-[140px] object-contain"
                />
              ) : (
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {copy.brandSubtitle}
                </p>
              )}
              <p className="text-lg font-bold text-foreground">{copy.brandTitle}</p>
            </div>
          ) : (
            <span className="sr-only">{copy.brandTitle}</span>
          )}
          <button
            type="button"
            aria-label={mobileOpen ? copy.closeMenuAriaLabel : copy.menuAriaLabel}
            onClick={() => {
              if (mobileOpen) {
                setMobileOpen(false);
                return;
              }
              setCollapsed((previous) => !previous);
            }}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {navItems.map((item) => {
            const Icon = NAV_ICON_MAP[item.key] ?? LayoutDashboard;

            return (
              <Link
                key={item.key}
                href={item.href}
                title={item.label}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  item.isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                } ${showSidebarLabel ? "justify-start" : "md:justify-center"}`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {showSidebarLabel ? <span>{item.label}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <Link
            href={openSalesHref}
            className={`mb-1.5 flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ${
              showSidebarLabel ? "justify-start" : "md:justify-center"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-primary" />
            {showSidebarLabel ? <span>{copy.openSalesAction}</span> : null}
          </Link>

          <Link
            href={openProductHref}
            className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ${
              showSidebarLabel ? "justify-start" : "md:justify-center"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-success" />
            {showSidebarLabel ? <span>{copy.openProductAction}</span> : null}
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-card">
          <div className="flex h-14 items-center justify-between px-4 md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label={copy.menuAriaLabel}
                onClick={() => setMobileOpen(true)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>

              <span className="max-w-[11rem] truncate text-sm font-semibold text-foreground md:hidden">
                {activeNavLabel}
              </span>

              <span className="hidden max-w-[16rem] truncate text-sm font-semibold text-foreground md:inline-flex xl:hidden">
                {activeNavLabel}
              </span>

              {showGlobalBranchSelector ? (
                <div className="hidden max-w-[24rem] items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-sm transition-colors hover:bg-accent/80 xl:flex">
                  <span className="shrink-0 text-muted-foreground">{copy.branchLabelPrefix}:</span>
                  <label className="sr-only" htmlFor="dashboard-shell-branch">
                    {copy.branchSelectorLabel}
                  </label>
                  <select
                    id="dashboard-shell-branch"
                    value={currentBranchId ?? ""}
                    onChange={(event) => setCurrentBranch(event.target.value)}
                    className="h-5 w-56 min-w-0 bg-transparent text-sm text-foreground outline-none dark:[color-scheme:dark] 2xl:w-72"
                  >
                    {branchOptions.length > 0 ? (
                      branchOptions.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                          className="bg-popover text-popover-foreground"
                        >
                          {option.label}
                        </option>
                      ))
                    ) : (
                      <option value="" className="bg-popover text-popover-foreground">
                        {copy.branchSelectorPlaceholder}
                      </option>
                    )}
                  </select>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              ) : null}

              <label className="sr-only" htmlFor="dashboard-shell-search">
                {copy.searchAriaLabel}
              </label>
              <div className="relative hidden xl:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="dashboard-shell-search"
                  aria-label={copy.searchAriaLabel}
                  type="text"
                  placeholder={copy.searchPlaceholder}
                  className="h-9 w-52 rounded-lg border-0 bg-accent pl-9 pr-4 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring 2xl:w-64"
                />
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => switchLocale(currentLocale === "vi" ? "en" : "vi")}
                className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-border bg-background px-2 text-[11px] font-bold text-foreground transition-colors hover:bg-accent sm:hidden"
              >
                {currentLocale === "vi" ? "VI" : "EN"}
              </button>

              <div className="hidden h-9 rounded-lg border border-border bg-background p-1 sm:inline-flex">
                <button
                  type="button"
                  onClick={() => switchLocale("vi")}
                  className={`rounded-md px-2.5 text-[11px] font-bold ${
                    currentLocale === "vi"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  VI
                </button>
                <button
                  type="button"
                  onClick={() => switchLocale("en")}
                  className={`rounded-md px-2.5 text-[11px] font-bold ${
                    currentLocale === "en"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  EN
                </button>
              </div>

              <ThemeToggle />
              <div className="hidden 2xl:block">
                <PaletteSelect />
              </div>
              <div className="hidden 2xl:block">
                <PwaInstallButton />
              </div>

              <NotificationsCenter
                locale={currentLocale}
                triggerAriaLabel={copy.notificationsAriaLabel}
              />

              <div className="hidden items-center gap-2 rounded-lg border border-border bg-background px-2 py-1 2xl:flex">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {userInitial}
                </span>
                <div className="text-right leading-tight">
                  <p className="text-xs font-semibold text-foreground">{userLabel}</p>
                  <p className="text-[11px] uppercase text-muted-foreground">{roleLabel}</p>
                </div>
              </div>

              <button
                type="button"
                aria-label={copy.signOutAction}
                title={copy.signOutAction}
                onClick={() => void handleSignOut()}
                className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-destructive/35 bg-destructive/10 text-destructive transition-colors hover:bg-destructive/15 2xl:hidden"
              >
                <LogOut className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="ml-1 hidden h-9 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground hover:bg-accent 2xl:inline-flex"
              >
                {copy.signOutAction}
              </button>
            </div>
          </div>

          {showGlobalBranchSelector ? (
            <div className="border-t border-border px-4 py-2 xl:hidden">
              <label className="space-y-1 text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-wide">{copy.branchSelectorLabel}</span>
                <select
                  value={currentBranchId ?? ""}
                  onChange={(event) => setCurrentBranch(event.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground dark:[color-scheme:dark]"
                >
                  {branchOptions.length > 0 ? (
                    branchOptions.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        className="bg-popover text-popover-foreground"
                      >
                        {option.label}
                      </option>
                    ))
                  ) : (
                    <option value="" className="bg-popover text-popover-foreground">
                      {copy.branchSelectorPlaceholder}
                    </option>
                  )}
                </select>
              </label>
            </div>
          ) : null}
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 animate-fade-in">{children}</main>
      </div>
    </div>
  );
});
