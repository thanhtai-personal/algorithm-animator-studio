import { LogIn, LogOut, Menu, Moon, PanelLeftOpen, Play, Sparkles, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { APP_TITLE } from "@/components/appNavigation";
import type { SidebarMode } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFantasticMode } from "@/hooks/use-fantastic-mode";
import { AUTH_STATE_EVENT, AuthProfile, getCurrentProfile, signOut } from "@/lib/auth";
import { requestChillPlayback } from "@/lib/chillMusicSettings";
import { t, type Lang, readSystemLang, subscribeSystemLang, writeSystemLang  } from "@/lib/i18n";

type AppHeaderProps = {
  sidebarMode: SidebarMode;
  onToggleSidebar: () => void;
};

export function AppHeader({ sidebarMode, onToggleSidebar }: AppHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { resolvedTheme, setTheme } = useTheme();
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [lang, setLang] = useState<Lang>(() => readSystemLang("en"));
  const [mounted, setMounted] = useState(false);
  const [fantasticMode, setFantasticMode] = useFantasticMode();
  const isAuthenticated = profile !== null;
  const authLabel = isAuthenticated ? t(lang, "uiLogout") : t(lang, "uiLogin");
  const authAriaLabel = isAuthenticated ? t(lang, "uiLogoutAccount") : t(lang, "uiLoginAccount");
  const authFrom = location.pathname === "/auth" ? "/" : location.pathname;

  const refreshProfile = useCallback(() => {
    let active = true;
    getCurrentProfile()
      .then((nextProfile) => {
        if (active) setProfile(nextProfile);
      })
      .catch(() => {
        if (active) setProfile(null);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const cancelRefresh = refreshProfile();
    const handleAuthChange = () => { refreshProfile(); };
    window.addEventListener(AUTH_STATE_EVENT, handleAuthChange);
    window.addEventListener("focus", handleAuthChange);

    return () => {
      cancelRefresh();
      window.removeEventListener(AUTH_STATE_EVENT, handleAuthChange);
      window.removeEventListener("focus", handleAuthChange);
    };
  }, [location.pathname, refreshProfile]);

  useEffect(() => subscribeSystemLang(setLang), []);

  function changeLanguage(nextLang: Lang) {
    setLang(nextLang);
    writeSystemLang(nextLang);
  }

  async function handleSignOut() {
    await signOut();
    setProfile(null);
    navigate("/auth", { replace: true });
  }

  function toggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 px-3 py-2.5 shadow-[0_10px_40px_hsl(214_80%_5%/0.12)] backdrop-blur-xl md:px-5">
      <div className="flex items-center gap-3">
        <Button
          aria-label={sidebarMode === "hidden" ? t(lang, "uiOpenMenu") : t(lang, "uiHideMenu")}
          className="h-10 w-10 shrink-0"
          size="icon"
          variant="outline"
          onClick={onToggleSidebar}
        >
          {sidebarMode === "hidden" ? <PanelLeftOpen className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>

        <img src="/kai-studio-logo.svg" alt={t(lang, "uiKaiStudioLogo")} className="h-10 w-10 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-base font-black text-transparent md:text-lg">{APP_TITLE}</h1>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className={[
              "fantastic-toggle hidden h-10 items-center gap-2 rounded-full border px-3 text-sm font-bold transition-all duration-300 md:inline-flex",
              fantasticMode
                ? "border-amber-300/70 bg-amber-300 text-slate-950 shadow-[0_0_24px_hsl(39_96%_57%/0.42)]"
                : "border-input bg-background/70 text-muted-foreground hover:border-primary/60 hover:bg-primary/10 hover:text-foreground",
            ].join(" ")}
            aria-pressed={fantasticMode}
            aria-label={t(lang, "uiToggleFantasticMode")}
            title={t(lang, "uiFantasticMode")}
            onClick={() => setFantasticMode(!fantasticMode)}
          >
            <Sparkles className="h-4 w-4" />
            <span>Fantastic</span>
            <span className={fantasticMode ? "fantastic-toggle-dot is-on" : "fantastic-toggle-dot"} />
          </button>
          <Button
            type="button"
            className={fantasticMode ? "h-10 shrink-0 border-amber-300/70 bg-amber-300 text-slate-950 shadow-[0_0_24px_hsl(39_96%_57%/0.42)] md:hidden" : "h-10 shrink-0 md:hidden"}
            size="icon"
            variant={fantasticMode ? "outline" : "outline"}
            aria-pressed={fantasticMode}
            aria-label={t(lang, "uiToggleFantasticMode")}
            title={t(lang, "uiFantasticMode")}
            onClick={() => setFantasticMode(!fantasticMode)}
          >
            <Sparkles className="h-4 w-4" />
          </Button>
          <div
            aria-hidden={!fantasticMode}
            className={[
              "flex shrink-0 overflow-hidden transition-all duration-500 ease-out",
              fantasticMode
                ? "max-w-[156px] translate-y-0 scale-100 opacity-100 blur-0"
                : "pointer-events-none max-w-0 -translate-y-1 scale-75 opacity-0 blur-sm",
            ].join(" ")}
          >
            <Button
              type="button"
              className="h-10 shrink-0 border-cyan-300/70 bg-cyan-400 text-slate-950 shadow-[0_0_22px_hsl(187_92%_63%/0.34)] hover:bg-cyan-300"
              size="sm"
              variant="outline"
              aria-label={t(lang, "uiPlayChillModeMusic")}
              disabled={!fantasticMode}
              tabIndex={fantasticMode ? 0 : -1}
              title={t(lang, "uiPlayChillModeMusic")}
              onClick={requestChillPlayback}
            >
              <Play className="h-4 w-4" />
            </Button>
          </div>
          <Select value={lang} onValueChange={(value) => changeLanguage(value as Lang)}>
            <SelectTrigger className="h-10 w-[92px] shrink-0 md:w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="vi">{t(lang, "uiVietnamese")}</SelectItem>
            </SelectContent>
          </Select>
          <Button aria-label={t(lang, "uiToggleLightDarkTheme")} className="h-10 shrink-0" size="icon" variant="outline" onClick={toggleTheme}>
            {mounted && resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {isAuthenticated ? (
            <Button
              aria-label={authAriaLabel}
              className="h-10 shrink-0 border-red-500/70 bg-red-600 text-white shadow-[0_10px_28px_hsl(0_76%_45%/0.24)] hover:bg-red-700"
              variant="outline"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">{authLabel}</span>
            </Button>
          ) : (
            <Button
              aria-label={authAriaLabel}
              className="h-10 shrink-0 border-emerald-500/70 bg-emerald-600 text-white shadow-[0_10px_28px_hsl(150_80%_38%/0.24)] hover:bg-emerald-700"
              variant="outline"
              onClick={() => navigate("/auth", { state: { from: authFrom } })}
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden md:inline">{authLabel}</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
