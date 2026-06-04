import { type CSSProperties, type PropsWithChildren, useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AppSidebar, type SidebarMode } from "@/components/AppSidebar";
import { readSystemLang, subscribeSystemLang, type Lang } from "@/lib/i18n";

const SIDEBAR_STORAGE_KEY = "kai-studio.sidebar.mode";

function readSidebarMode(): SidebarMode {
  if (typeof window === "undefined") return "expanded";
  const saved = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
  return saved === "collapsed" || saved === "hidden" || saved === "expanded" ? saved : "expanded";
}

export function AppLayout({ children }: PropsWithChildren) {
  const [lang, setLang] = useState<Lang>(() => readSystemLang("en"));
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(() => readSidebarMode());

  useEffect(() => subscribeSystemLang(setLang), []);

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
    <div style={{ "--app-sidebar-width": sidebarWidth } as CSSProperties}>
      <AppHeader sidebarMode={sidebarMode} onToggleSidebar={toggleSidebar} />
      <AppSidebar lang={lang} mode={sidebarMode} onClose={() => setSidebarMode("hidden")} onCollapse={() => setSidebarMode("collapsed")} onExpand={() => setSidebarMode("expanded")} />
      <div className="transition-[padding] duration-300 lg:pl-[var(--app-sidebar-width)]">
        {children}
      </div>
    </div>
  );
}
