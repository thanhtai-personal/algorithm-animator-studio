import { NavLink, useNavigation } from "react-router";
import { useI18n, type Language } from "../i18n";
import { useThemeSettings } from "../theme/themeStorage";
import { PUBLIC_WEB_BUILD } from "../utils/publicRuntime";
import { ProductionConsoleGuard } from "./security/ProductionConsoleGuard";

type IconName = "mic" | "video" | "folder" | "youtube" | "settings" | "spark" | "language" | "play" | "lock" | "book" | "activity";

const mainNavItems = [
  { to: "/", labelKey: "homeNav", icon: "mic", end: true },
  { to: "/video", labelKey: "videoNav", icon: "video" },
  { to: "/shorts", labelKey: "shortsNav", icon: "spark" },
  { to: "/resources", labelKey: "resourcesNav", icon: "folder" },
  { to: "/youtube", labelKey: "youtubeNav", icon: "youtube", end: true },
] as const;

const youtubeSubNavItems = [
  { to: "/youtube", labelKey: "youtubeUploadSubNav", end: true },
  { to: "/youtube/calendar", labelKey: "youtubeCalendarSubNav" },
] as const;
const instructionsNavItem = { to: "/instructions", labelKey: "instructionsNav", icon: "book" } as const;
const healthToolsNavItem = { to: "/health-check", labelKey: "healthToolsNav", icon: "activity" } as const;
const settingsNavItem = { to: "/settings", labelKey: "settingsNav", icon: "settings" } as const;
const legalNavItems = [
  { to: "/privacy", labelKey: "privacyNav" },
  { to: "/term", labelKey: "termsNav" },
] as const;
const bottomNavItems = [instructionsNavItem, healthToolsNavItem, settingsNavItem] as const;
const publicMainNavItems = mainNavItems.filter((item) => !["/shorts", "/youtube"].includes(item.to));
const publicBottomNavItems = [instructionsNavItem, healthToolsNavItem] as const;
const effectiveMainNavItems = PUBLIC_WEB_BUILD ? publicMainNavItems : mainNavItems;
const effectiveBottomNavItems = PUBLIC_WEB_BUILD ? publicBottomNavItems : bottomNavItems;
const mobileNavItems = [...effectiveMainNavItems, ...effectiveBottomNavItems] as const;

export function AppShell({ children, showRouteOverlay = true }: { children: React.ReactNode; showRouteOverlay?: boolean }) {
  const { language, setLanguage, t } = useI18n();
  const { mode, setMode } = useThemeSettings();
  const navigation = useNavigation();
  const isDark = mode !== "light";
  const isRouteTransitioning = showRouteOverlay && navigation.state !== "idle";

  return (
    <div className="min-h-screen flex">
      <ProductionConsoleGuard />
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl sticky top-0 h-screen">
        <div className="px-5 py-5 flex items-center gap-3 border-b border-sidebar-border">
          <BrandMark />
          <div className="leading-tight min-w-0">
            <div className="font-display font-semibold truncate">{t("appBrandName")}</div>
            <div className="text-xs text-muted-foreground truncate">{t("appBrandSub")}</div>
          </div>
        </div>

        <nav className="p-3 space-y-1" aria-label={t("mainNavigation")}>
          {effectiveMainNavItems.map((item) => {
            const isYoutubeGroup = item.to === "/youtube";
            const showYoutubeChildren = isYoutubeGroup;

            return (
              <div key={item.to} className="sidebarNavGroup">
                <NavLink
                  to={item.to}
                  end={"end" in item ? item.end : undefined}
                  className={({ isActive }) => {
                    const shouldShowActive = isYoutubeGroup ? false : isActive;

                    return [
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                      shouldShowActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50",
                    ].join(" ");
                  }}
                >
                  <AppIcon name={item.icon} className="size-4" />
                  <span className="font-medium">{t(item.labelKey)}</span>
                </NavLink>

                {showYoutubeChildren ? (
                  <div className="sidebarSubNav" aria-label={t("youtubeSubNavigation")}>
                    {youtubeSubNavItems.map((subItem) => (
                      <NavLink
                        key={subItem.to}
                        to={subItem.to}
                        end={"end" in subItem ? subItem.end : undefined}
                        className={({ isActive }) =>
                          ["sidebarSubNavItem", isActive ? "active" : ""].filter(Boolean).join(" ")
                        }
                      >
                        {t(subItem.labelKey)}
                      </NavLink>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-sidebar-border">
          <nav className="p-3 space-y-1" aria-label={t("settingsNav")}>
            {effectiveBottomNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50",
                  ].join(" ")
                }
              >
                <AppIcon name={item.icon} className="size-4" />
                <span className="font-medium">{t(item.labelKey)}</span>
              </NavLink>
            ))}
          </nav>

          <nav className="px-5 pb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground" aria-label={t("legalNavigation")}>
            {legalNavItems.map((item, index) => (
              <span key={item.to} className="inline-flex items-center gap-2">
                {index > 0 ? <span aria-hidden>·</span> : null}
                <NavLink className="hover:text-foreground transition-colors" to={item.to}>
                  {t(item.labelKey)}
                </NavLink>
              </span>
            ))}
          </nav>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4 px-4 md:px-8 h-16">
            <div className="md:hidden flex items-center gap-2 min-w-0">
              <BrandMark compact />
              <span className="font-display font-semibold truncate">{t("appBrandName")}</span>
            </div>

            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              <span className="size-2 rounded-full bg-success animate-pulse" />
              {PUBLIC_WEB_BUILD ? t("publicWebReady") : t("piperReady")}
            </div>

            <div className="headerControls">
              <button
                className="themeToggleButton"
                type="button"
                onClick={() => setMode(isDark ? "light" : "dark")}
                aria-label={isDark ? t("switchToLightTheme") : t("switchToDarkTheme")}
              >
                <span aria-hidden>{isDark ? "☾" : "☀"}</span>
                <span>{isDark ? t("darkTheme") : t("lightTheme")}</span>
              </button>

              <label className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm hover:bg-accent transition-colors">
                <AppIcon name="language" className="size-4" />
                <span className="sr-only">{t("languageLabel")}</span>
                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value as Language)}
                  aria-label={t("languageLabel")}
                  className="plainSelect bg-transparent text-sm outline-none cursor-pointer"
                >
                  <option value="en">{t("english")}</option>
                  <option value="vi">{t("vietnamese")}</option>
                </select>
              </label>
            </div>
          </div>

          <nav className="md:hidden flex gap-1 overflow-x-auto px-3 pb-3" aria-label={t("mainNavigation")}>
            {mobileNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={"end" in item ? item.end : undefined}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-xs whitespace-nowrap",
                    isActive ? "bg-accent text-foreground" : "text-muted-foreground",
                  ].join(" ")
                }
              >
                <AppIcon name={item.icon} className="size-3.5" />
                {t(item.labelKey)}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="relative flex-1 px-3 sm:px-4 lg:px-6 py-5 md:py-8">
          <div className="mx-auto w-full max-w-[1500px] space-y-5 md:space-y-6">
            {children}
          </div>
          <ContentLoadingOverlay active={isRouteTransitioning} />
        </main>
      </div>
    </div>
  );
}



function ContentLoadingOverlay({ active }: { active: boolean }) {
  return (
    <div
      className={["contentLoadingOverlay", active ? "active" : ""].filter(Boolean).join(" ")}
      aria-hidden={!active}
    >
      <span className="pageTransitionSpinner" aria-hidden="true" />
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
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight">{title}</h1>
          {badge}
        </div>
        {description ? <p className="mt-2 text-muted-foreground max-w-2xl">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function SectionCard({
  step,
  title,
  description,
  children,
  sticky,
}: {
  step?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  sticky?: boolean;
}) {
  return (
    <section className={["surface-card p-6 space-y-4", sticky ? "lg:sticky lg:top-24" : ""].join(" ")}>
      <div className="flex items-start gap-3">
        {step ? (
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg btn-primary-grad text-center text-sm font-bold leading-none">
            <span className="block leading-none">{step}</span>
          </span>
        ) : null}
        <div>
          <h2 className="text-lg font-display font-semibold">{title}</h2>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  action,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
        {action}
      </div>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function StatusBadge({ variant = "neutral", children }: { variant?: "success" | "error" | "neutral"; children: React.ReactNode }) {
  return <span className={`chip ${variant === "success" ? "chip-success" : variant === "error" ? "chip-error" : ""}`}>{children}</span>;
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <img
      src="/logo.png"
      alt="Kata Studio"
      className={`${compact ? "size-8 rounded-lg" : "size-10 rounded-xl"} appBrandLogo`}
      draggable={false}
    />
  );
}

export function AppIcon({ name, className = "" }: { name: IconName; className?: string }) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "mic":
      return <svg {...common}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><path d="M12 19v3" /></svg>;
    case "video":
      return <svg {...common}><path d="m22 8-6 4 6 4V8Z" /><rect width="14" height="12" x="2" y="6" rx="2" /></svg>;
    case "folder":
      return <svg {...common}><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.5L10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" /></svg>;
    case "youtube":
      return <svg {...common}><path d="M2.5 17a24.1 24.1 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.6 49.6 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.1 24.1 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.6 49.6 0 0 1-16.2 0A2 2 0 0 1 2.5 17Z" /><path d="m10 15 5-3-5-3v6Z" /></svg>;
    case "settings":
      return <svg {...common}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.52a2 2 0 0 1-1 1.72l-.15.1a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.52a2 2 0 0 1 1-1.72l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z" /><circle cx="12" cy="12" r="3" /></svg>;
    case "spark":
      return <svg {...common}><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" /><path d="M19 16v4" /><path d="M21 18h-4" /></svg>;
    case "language":
      return <svg {...common}><path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" /><path d="m22 22-5-10-5 10" /><path d="M14 18h6" /></svg>;
    case "play":
      return <svg {...common}><path d="m8 5 11 7-11 7V5Z" /></svg>;
    case "lock":
      return <svg {...common}><rect width="16" height="11" x="4" y="11" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>;
    case "book":
      return <svg {...common}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15Z" /><path d="M8 7h8" /><path d="M8 11h6" /></svg>;
    case "activity":
      return <svg {...common}><path d="M22 12h-4l-3 7-6-14-3 7H2" /><path d="M14 19h6" /><path d="M4 5h4" /></svg>;
  }
}

// Backward-compatible export. New pages use AppShell directly.
export function AppHeader() {
  return null;
}
