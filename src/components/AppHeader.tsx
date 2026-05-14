import { Film, LogIn, LogOut, Settings, Sparkles, Youtube } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuthProfile, getCurrentProfile, isSuperAdminProfile, signOut } from "@/lib/auth";
import { type Lang, readSystemLang, subscribeSystemLang, writeSystemLang } from "@/lib/i18n";

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "AlgoShorts Studio",
    subtitle: "Create short algorithm animations for Shorts, Reels and TikTok.",
  },
  "/long-content": {
    title: "Long Content Studio",
    subtitle: "Create 16:9 YouTube explainers with animation, script, voice and music.",
  },
  "/youtube": {
    title: "YouTube Publishing",
    subtitle: "Login with OAuth from server .env, then upload exported videos.",
  },
  "/settings": {
    title: "Settings",
    subtitle: "Configure local Piper runtime paths and health check.",
  },
  "/youtube-publishing": {
    title: "YouTube Publishing",
    subtitle: "Login with OAuth from server .env, then upload exported videos.",
  },
  "/social-publishing": {
    title: "YouTube Publishing",
    subtitle: "Login with OAuth from server .env, then upload exported videos.",
  },
};

export function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [lang, setLang] = useState<Lang>(() => readSystemLang("en"));
  const meta = useMemo(() => PAGE_META[location.pathname] ?? PAGE_META["/"], [location.pathname]);
  const canConfigure = isSuperAdminProfile(profile);

  useEffect(() => {
    let cancelled = false;
    getCurrentProfile()
      .then((nextProfile) => {
        if (!cancelled) setProfile(isSuperAdminProfile(nextProfile) ? nextProfile : null);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      });

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

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

  return (
    <header className="border-b border-border/40 px-4 py-4 md:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400">
            <Sparkles className="h-6 w-6 text-slate-900" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold">{meta.title}</h1>
            <p className="truncate text-xs text-muted-foreground">{meta.subtitle}</p>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          <Button variant={location.pathname === "/" ? "default" : "outline"} onClick={() => navigate("/")}>Short Studio</Button>
          <Button variant={location.pathname === "/long-content" ? "default" : "outline"} onClick={() => navigate("/long-content")}>
            <Film className="mr-2 h-4 w-4" /> Long 16:9
          </Button>
          <Button variant={location.pathname.startsWith("/youtube") || location.pathname === "/social-publishing" ? "default" : "outline"} onClick={() => navigate("/youtube")}>
            <Youtube className="mr-2 h-4 w-4" /> YouTube
          </Button>
          <Button variant={location.pathname === "/settings" ? "default" : "outline"} onClick={() => navigate("/settings")}>
            <Settings className="mr-2 h-4 w-4" /> Settings
          </Button>
          <Select value={lang} onValueChange={(value) => changeLanguage(value as Lang)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="vi">Tiếng Việt</SelectItem>
            </SelectContent>
          </Select>
          {canConfigure ? (
            <Button aria-label="Đăng xuất" size="icon" variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          ) : (
            <Button aria-label="Đăng nhập" size="icon" variant="outline" onClick={() => navigate("/auth", { state: { from: location.pathname } })}>
              <LogIn className="h-4 w-4" />
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
