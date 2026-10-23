import { ChevronLeft, ChevronRight, PanelLeftClose, Play, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { APP_NAVIGATION_GROUPS, APP_TITLE, filterNavigationGroupsByFeatures } from "@/components/appNavigation";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { t, type Lang  } from "@/lib/i18n";
import { getMenuFeatureSettings, subscribeMenuFeatureSettings } from "@/lib/menuFeatureSettings";
import { cn } from "@/lib/utils";

export type SidebarMode = "expanded" | "collapsed" | "hidden";

type AppSidebarProps = {
  lang: Lang;
  mode: SidebarMode;
  onClose: () => void;
  onCollapse: () => void;
  onExpand: () => void;
};

export function AppSidebar({ lang, mode, onClose, onCollapse, onExpand }: AppSidebarProps) {
  const location = useLocation();
  const isHidden = mode === "hidden";
  const isCollapsed = mode === "collapsed";
  const [menuFeatures, setMenuFeatures] = useState(() => getMenuFeatureSettings());
  const visibleGroups = useMemo(() => filterNavigationGroupsByFeatures(APP_NAVIGATION_GROUPS, menuFeatures), [menuFeatures]);

  useEffect(() => subscribeMenuFeatureSettings(setMenuFeatures), []);

  return (
    <>
      {!isHidden ? <button aria-label={t(lang, "uiCloseMenu")} className="fixed inset-0 z-30 bg-background/70 backdrop-blur-sm lg:hidden" onClick={onClose} /> : null}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-dvh w-72 border-r border-border/60 bg-sidebar/90 shadow-2xl backdrop-blur-xl transition-all duration-300 lg:top-[65px] lg:h-[calc(100dvh-65px)] lg:shadow-[18px_0_50px_hsl(214_80%_5%/0.16)]",
          isHidden ? "-translate-x-full" : "translate-x-0",
          isCollapsed ? "lg:w-20" : "lg:w-72",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-2 border-b border-border/60 p-3 lg:hidden">
            <div className="flex min-w-0 items-center gap-2">
              <span role="img" aria-label={t(lang, "uiKaiStudioLogo")} className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary"><Play className="h-5 w-5 fill-current" /></span>
              <p className="truncate text-sm font-bold">{APP_TITLE}</p>
            </div>
            <Button aria-label={t(lang, "uiCloseMenu")} size="icon" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="hidden items-center justify-end gap-1 border-b border-border/60 p-3 lg:flex">
            <Button aria-label={isCollapsed ? t(lang, "uiExpandMenu") : t(lang, "uiCollapseMenu")} size="icon" variant="ghost" onClick={isCollapsed ? onExpand : onCollapse}>
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            {!isCollapsed ? (
              <Button aria-label={t(lang, "uiHideMenu")} size="icon" variant="ghost" onClick={onClose}>
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            ) : null}
          </div>

          <ScrollArea className="flex-1">
            <nav className="space-y-5 p-3">
              {visibleGroups.map((group) => (
                <div key={group.id} className="space-y-1.5">
                  {!isCollapsed ? (
                    <p className="px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-primary/80">
                      {group.label[lang]}
                    </p>
                  ) : (
                    <div className="mx-auto my-2 h-px w-8 bg-border/70" aria-hidden="true" />
                  )}

                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = item.matchPaths?.includes(location.pathname) ?? false;
                    const content = (
                      <NavLink
                        key={item.id}
                        to={item.to}
                        className={cn(
                          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-all duration-200 hover:bg-primary/10 hover:text-foreground hover:shadow-[0_8px_24px_hsl(var(--primary)/0.12)]",
                          active && "bg-primary text-primary-foreground shadow-[0_12px_34px_hsl(var(--primary)/0.28)] hover:bg-primary/90 hover:text-primary-foreground",
                          isCollapsed && "justify-center px-2",
                        )}
                        onClick={() => {
                          if (window.innerWidth < 1024) onClose();
                        }}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {!isCollapsed ? <span className="truncate">{item.label[lang]}</span> : null}
                      </NavLink>
                    );

                    if (!isCollapsed) return content;

                    return (
                      <Tooltip key={item.id}>
                        <TooltipTrigger asChild>{content}</TooltipTrigger>
                        <TooltipContent side="right">
                          <p className="font-medium">{item.label[lang]}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </nav>
          </ScrollArea>
        </div>
      </aside>
    </>
  );
}
