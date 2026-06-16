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

function readSidebarMode(): SidebarMode {
  if (typeof window === "undefined") return "expanded";
  const saved = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
  return saved === "collapsed" || saved === "hidden" || saved === "expanded" ? saved : "expanded";
}

export function AppLayout({ children }: PropsWithChildren) {
  const location = useLocation();
  const [lang, setLang] = useState<Lang>(() => readSystemLang("en"));
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(() => readSidebarMode());
  const [fantasticMode] = useFantasticMode();
  const [chillModeEnabled, setChillModeEnabled] = useState(() => readChillModeEnabled());

  useEffect(() => subscribeSystemLang(setLang), []);
  useEffect(() => subscribeChillMode(setChillModeEnabled), []);
  useFantasticFrameMotion(fantasticMode, location.pathname);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, sidebarMode);
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
      <FantasticModeBackdrop enabled={fantasticMode} />
      <AppHeader sidebarMode={sidebarMode} onToggleSidebar={toggleSidebar} />
      <AppSidebar lang={lang} mode={sidebarMode} onClose={() => setSidebarMode("hidden")} onCollapse={() => setSidebarMode("collapsed")} onExpand={() => setSidebarMode("expanded")} />
      <div className="relative z-10 transition-[padding] duration-300 lg:pl-[var(--app-sidebar-width)]">
        {children}
      </div>
      <ChillMusicNotifier enabled={fantasticMode} autoPlayEnabled={chillModeEnabled} />
      <BackgroundJobsNotifier />
    </div>
  );
}
