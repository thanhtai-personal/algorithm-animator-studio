import { LogIn, LogOut, Moon, Settings, Sparkles, Sun, Youtube } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AUTH_STATE_EVENT, AuthProfile, getCurrentProfile, signOut } from "@/lib/auth";
import { type Lang, readSystemLang, subscribeSystemLang, writeSystemLang } from "@/lib/i18n";

const getPageMeta = (lang: Lang): Record<string, { title: string; subtitle: string }> => ({
  "/": {
    title: "AlgoShorts Studio",
    subtitle: lang === "vi" ? "Tạo video thuật toán ngắn cho Shorts, Reels và TikTok." : "Create short algorithm animations for Shorts, Reels and TikTok.",
  },
  "/maze-pathfinding": {
    title: lang === "vi" ? "Tìm đường ra mê cung" : "Maze Pathfinding",
    subtitle: lang === "vi" ? "Tạo video tìm lối ra, so sánh DFS, BFS, Dijkstra và A*." : "Create maze escape videos comparing DFS, BFS, Dijkstra and A*.",
  },
  "/algorithm-world": {
    title: lang === "vi" ? "Tìm đường ra mê cung" : "Maze Pathfinding",
    subtitle: lang === "vi" ? "Tên Algorithm World sẽ dùng cho module lớn hơn sau này." : "Algorithm World is reserved for a broader module later.",
  },
  "/long-content": {
    title: lang === "vi" ? "Algorithm Long 16:9" : "Long Content Studio",
    subtitle: lang === "vi" ? "Tạo video YouTube 16:9 có animation, script, voice và nhạc." : "Create 16:9 YouTube explainers with animation, script, voice and music.",
  },
  "/story-video": {
    title: lang === "vi" ? "Kênh đọc truyện" : "Story Video Studio",
    subtitle: lang === "vi" ? "Tạo video đọc truyện từ URL, văn bản, giọng đọc và nền." : "Create reading-story videos from URLs, text, voice-over and background media.",
  },
  "/youtube": {
    title: lang === "vi" ? "Đăng YouTube" : "YouTube Publishing",
    subtitle: lang === "vi" ? "Đăng nhập OAuth qua server .env rồi upload video đã xuất." : "Login with OAuth from server .env, then upload exported videos.",
  },
  "/settings": {
    title: lang === "vi" ? "Cài đặt" : "Settings",
    subtitle: lang === "vi" ? "Cấu hình local Piper runtime path và kiểm tra trạng thái." : "Configure local Piper runtime paths and health check.",
  },
  "/youtube-publishing": {
    title: lang === "vi" ? "Đăng YouTube" : "YouTube Publishing",
    subtitle: lang === "vi" ? "Đăng nhập OAuth qua server .env rồi upload video đã xuất." : "Login with OAuth from server .env, then upload exported videos.",
  },
  "/social-publishing": {
    title: lang === "vi" ? "Đăng YouTube" : "YouTube Publishing",
    subtitle: lang === "vi" ? "Đăng nhập OAuth qua server .env rồi upload video đã xuất." : "Login with OAuth from server .env, then upload exported videos.",
  },
});

export function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { resolvedTheme, setTheme } = useTheme();
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [lang, setLang] = useState<Lang>(() => readSystemLang("en"));
  const [mounted, setMounted] = useState(false);
  const meta = useMemo(() => {
    const pageMeta = getPageMeta(lang);
    return pageMeta[location.pathname] ?? pageMeta["/"];
  }, [lang, location.pathname]);
  const contentMode = location.pathname === "/story-video"
    ? "story-video"
    : location.pathname === "/long-content"
      ? "algorithm-long"
      : (location.pathname === "/maze-pathfinding" || location.pathname === "/algorithm-world")
        ? "maze-pathfinding"
        : "algorithm-shorts";
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

  function changeContentMode(value: string) {
    if (value === "story-video") navigate("/story-video");
    else if (value === "algorithm-long") navigate("/long-content");
    else if (value === "maze-pathfinding") navigate("/maze-pathfinding");
    else navigate("/");
  }

  return (
    <header className="border-b border-border/40 bg-background/95 px-3 py-3 backdrop-blur md:px-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400">
            <Sparkles className="h-5 w-5 text-slate-900" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold md:text-lg">{meta.title}</h1>
            <p className="truncate text-xs text-muted-foreground">{meta.subtitle}</p>
          </div>
        </div>

        <nav className="flex items-center gap-2 overflow-x-auto pb-1 xl:pb-0">
          <Select value={contentMode} onValueChange={changeContentMode}>
            <SelectTrigger className="h-10 w-[230px] shrink-0"><SelectValue placeholder={lang === "vi" ? "Chọn studio" : "Choose studio"} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="algorithm-shorts">Algorithm Shorts</SelectItem>
              <SelectItem value="maze-pathfinding">{lang === "vi" ? "Tìm đường ra mê cung" : "Maze Pathfinding"}</SelectItem>
              <SelectItem value="algorithm-long">Algorithm Long 16:9</SelectItem>
              <SelectItem value="story-video">{lang === "vi" ? "Kênh đọc truyện" : "Story video"}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            className="h-10 shrink-0"
            variant={location.pathname.startsWith("/youtube") || location.pathname === "/social-publishing" ? "default" : "outline"}
            onClick={() => navigate("/youtube")}
          >
            <Youtube className="h-4 w-4" />
            <span className="hidden sm:inline">YouTube</span>
          </Button>
          <Button
            aria-label={lang === "vi" ? "Cài đặt" : "Settings"}
            className="h-10 shrink-0"
            size="icon"
            variant={location.pathname === "/settings" ? "default" : "outline"}
            onClick={() => navigate("/settings")}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Select value={lang} onValueChange={(value) => changeLanguage(value as Lang)}>
            <SelectTrigger className="h-10 w-28 shrink-0"><SelectValue /></SelectTrigger>
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
        </nav>
      </div>
    </header>
  );
}
