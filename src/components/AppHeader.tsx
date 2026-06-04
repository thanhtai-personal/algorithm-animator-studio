import { LogIn, LogOut, Menu, Moon, PanelLeftOpen, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { APP_TITLE } from "@/components/appNavigation";
import type { SidebarMode } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AUTH_STATE_EVENT, AuthProfile, getCurrentProfile, signOut } from "@/lib/auth";
import { type Lang, readSystemLang, subscribeSystemLang, writeSystemLang } from "@/lib/i18n";

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
  const isAuthenticated = profile !== null;
  const authLabel = lang === "vi" ? (isAuthenticated ? "Đăng xuất" : "Đăng nhập") : (isAuthenticated ? "Logout" : "Login");
  const authAriaLabel = lang === "vi" ? authLabel : `${authLabel} account`;
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
    <header className="sticky top-0 z-30 border-b border-border/40 bg-background/95 px-3 py-2.5 backdrop-blur md:px-5">
      <div className="flex items-center gap-3">
        <Button
          aria-label={sidebarMode === "hidden" ? (lang === "vi" ? "Mở menu" : "Open menu") : (lang === "vi" ? "Ẩn menu" : "Hide menu")}
          className="h-10 w-10 shrink-0"
          size="icon"
          variant="outline"
          onClick={onToggleSidebar}
        >
          {sidebarMode === "hidden" ? <PanelLeftOpen className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>

        <img src="/kai-studio-logo.svg" alt="KAI STUDIO logo" className="h-10 w-10 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold md:text-lg">{APP_TITLE}</h1>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Select value={lang} onValueChange={(value) => changeLanguage(value as Lang)}>
            <SelectTrigger className="h-10 w-[92px] shrink-0 md:w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="vi">Tiếng Việt</SelectItem>
            </SelectContent>
          </Select>
          <Button aria-label={lang === "vi" ? "Đổi giao diện sáng/tối" : "Toggle light/dark theme"} className="h-10 shrink-0" size="icon" variant="outline" onClick={toggleTheme}>
            {mounted && resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {isAuthenticated ? (
            <Button
              aria-label={authAriaLabel}
              className="h-10 shrink-0 border-red-500/70 bg-red-600 text-white hover:bg-red-700"
              variant="outline"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">{authLabel}</span>
            </Button>
          ) : (
            <Button
              aria-label={authAriaLabel}
              className="h-10 shrink-0 border-emerald-500/70 bg-emerald-600 text-white hover:bg-emerald-700"
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
