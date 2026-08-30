import { type CSSProperties, type PropsWithChildren, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { AppSidebar, type SidebarMode } from "@/components/AppSidebar";
import { BackgroundJobsNotifier } from "@/components/BackgroundJobsNotifier";
import { ChillMusicNotifier } from "@/components/ChillMusicNotifier";
import { FantasticModeBackdrop } from "@/components/FantasticModeBackdrop";
import { useFantasticFrameMotion } from "@/hooks/use-fantastic-frame-motion";
import { useFantasticMode } from "@/hooks/use-fantastic-mode";
import { readChillModeEnabled, subscribeChillMode } from "@/lib/chillMusicSettings";
import { readSystemLang, subscribeSystemLang, type Lang } from "@/lib/i18n";

const SIDEBAR_STORAGE_KEY = "kai-studio.sidebar.mode";
const DESKTOP_SIDEBAR_BREAKPOINT = 1024;

function readSidebarMode(): SidebarMode {
  if (typeof window === "undefined") return "expanded";
  const saved = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
  return saved === "collapsed" || saved === "hidden" || saved === "expanded" ? saved : "expanded";
}

function readResponsiveSidebarMode(): SidebarMode {
  if (typeof window !== "undefined" && window.innerWidth < DESKTOP_SIDEBAR_BREAKPOINT) return "hidden";
  return readSidebarMode();
}

export function AppLayout({ children }: PropsWithChildren) {
  const location = useLocation();
  const [lang, setLang] = useState<Lang>(() => readSystemLang("en"));
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(readResponsiveSidebarMode);
  const [fantasticMode] = useFantasticMode();
  const [chillModeEnabled, setChillModeEnabled] = useState(() => readChillModeEnabled());
  const algorithmStudioActive = location.pathname === "/algorithms" || location.pathname.startsWith("/algorithms/");
  const rhythmicStudioActive = location.pathname.startsWith("/algorithms/rhythmic") || location.pathname.startsWith("/algorithms/marble-tower");
  const fantasticVisualsEnabled = fantasticMode && !algorithmStudioActive;

  useEffect(() => subscribeSystemLang(setLang), []);
  useEffect(() => subscribeChillMode(setChillModeEnabled), []);
  useEffect(() => {
    const query = window.matchMedia(`(min-width: ${DESKTOP_SIDEBAR_BREAKPOINT}px)`);
    const syncSidebarToViewport = (event: MediaQueryListEvent) => {
      setSidebarMode(event.matches ? readSidebarMode() : "hidden");
    };
    query.addEventListener("change", syncSidebarToViewport);
    return () => query.removeEventListener("change", syncSidebarToViewport);
  }, []);
  // Algorithm studios own large Canvas/WebGL previews. Keep the decorative
  // fullscreen canvas and entrance filters off these routes to avoid stacking
  // GPU/compositor work while the editor is mounting.
  useFantasticFrameMotion(fantasticVisualsEnabled, location.pathname);

  useEffect(() => {
    if (window.innerWidth >= DESKTOP_SIDEBAR_BREAKPOINT) {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, sidebarMode);
    }
  }, [sidebarMode]);

  const sidebarWidth = useMemo(() => {
    if (sidebarMode === "expanded") return "18rem";
    if (sidebarMode === "collapsed") return "5rem";
    return "0rem";
  }, [sidebarMode]);

  function toggleSidebar() {
    setSidebarMode((mode) => (mode === "hidden" ? "expanded" : "hidden"));
  }

  return (
    <div className="min-h-screen kai-grid-bg" style={{ "--app-sidebar-width": sidebarWidth } as CSSProperties}>
      <FantasticModeBackdrop enabled={fantasticVisualsEnabled} />
      <AppHeader sidebarMode={sidebarMode} onToggleSidebar={toggleSidebar} />
      <AppSidebar lang={lang} mode={sidebarMode} onClose={() => setSidebarMode("hidden")} onCollapse={() => setSidebarMode("collapsed")} onExpand={() => setSidebarMode("expanded")} />
      <div className="relative z-10 transition-[padding] duration-300 lg:pl-[var(--app-sidebar-width)]">
        {children}
      </div>
      <ChillMusicNotifier enabled={fantasticMode && chillModeEnabled} />
      {!rhythmicStudioActive ? <BackgroundJobsNotifier /> : null}
    </div>
  );
}
