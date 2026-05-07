"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Home, Mic, Settings, ShoppingBag, TrendingUp } from "lucide-react";
import type { TabKey } from "../stores/appShellStore";
import { cn } from "@/utils";
import styles from "./TabBar.module.css";
import { useI18n } from "@/lib/i18n";

interface TabBarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  onMicClick: () => void;
  isListening?: boolean;
  isAIMode?: boolean;
}

const NOTCH_WIDTH = 140;
const NOTCH_DEPTH = 56; // deeper scoop ~2/3 bar height
const TOP_EDGE = 10;
const BAR_HEIGHT = 90;
const BUTTON_SIZE = 56;
const BUTTON_LIFT = 30; // lift button upward within the notch
const TAB_SPREAD = 28;
const TAB_STAGGER = 80;
function buildNotchPath(width: number) {
  const safeWidth = Math.max(width, NOTCH_WIDTH + 60);
  const leftX = (safeWidth - NOTCH_WIDTH) / 2;
  const rightX = leftX + NOTCH_WIDTH;
  const centerX = safeWidth / 2;
  const valleyY = TOP_EDGE + NOTCH_DEPTH;
  const curve = NOTCH_WIDTH * 0.25;

  // U-shaped top edge dipping down at center
  return [
    `M0 ${TOP_EDGE}`,
    `H${leftX.toFixed(2)}`,
    `C${(leftX + curve).toFixed(2)} ${TOP_EDGE}`,
    `${(centerX - curve).toFixed(2)} ${valleyY.toFixed(2)}`,
    `${centerX.toFixed(2)} ${valleyY.toFixed(2)}`,
    `C${(centerX + curve).toFixed(2)} ${valleyY.toFixed(2)}`,
    `${(rightX - curve).toFixed(2)} ${TOP_EDGE}`,
    `${rightX.toFixed(2)} ${TOP_EDGE}`,
    `H${safeWidth.toFixed(2)}`,
    `V${BAR_HEIGHT}`,
    "H0",
    "Z",
  ].join(" ");
}

export function TabBar({ activeTab, onTabChange, onMicClick, isListening = false, isAIMode = false }: TabBarProps) {
  const { t } = useI18n();
  const tabs = useMemo<{ id: TabKey; icon: typeof Home; label: string }[]>(
    () => [
      { id: "home", icon: Home, label: t("tabs.home") },
      { id: "stats", icon: TrendingUp, label: t("tabs.stats") },
      { id: "store", icon: ShoppingBag, label: t("tabs.store") },
      { id: "settings", icon: Settings, label: t("tabs.settings") },
    ],
    [t],
  );

  const leftTabs = tabs.slice(0, 2);
  const rightTabs = tabs.slice(2);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [clipPath, setClipPath] = useState<string | undefined>(undefined);
  const [animateTabs, setAnimateTabs] = useState(false);
  const valleyY = TOP_EDGE + NOTCH_DEPTH;
  const buttonTop = valleyY - BUTTON_SIZE / 2 - BUTTON_LIFT;

  useEffect(() => {
    const node = shellRef.current;
    if (!node) return;

    const update = () => {
      const width = node.getBoundingClientRect().width;
      setClipPath(buildNotchPath(width));
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setAnimateTabs(true), 80);
    return () => window.clearTimeout(timer);
  }, []);

  const buildFlyStyle = (side: "left" | "right", index: number): CSSProperties => {
    const direction = side === "left" ? -1 : 1;
    return {
      ["--start-x" as string]: `${direction * TAB_SPREAD * (index + 1)}px`,
      animationDelay: `${TAB_STAGGER * index}ms`,
    };
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 w-full overflow-hidden" style={{ maxWidth: "100vw" }}>
      <div className="relative w-full" style={{ maxWidth: "100vw" }}>
        <div
          ref={shellRef}
          className="relative overflow-visible rounded-t-3xl border border-border shadow-lg backdrop-blur-md"
          style={{
            height: BAR_HEIGHT,
            clipPath: clipPath ? `path("${clipPath}")` : undefined,
            WebkitClipPath: clipPath ? `path("${clipPath}")` : undefined,
            backgroundColor: "var(--tabbar-bg)",
          }}
        >
          <svg
            className="pointer-events-none absolute inset-x-0 bottom-0 h-6 w-full"
            viewBox="0 0 120 28"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0 12 C18 0 36 20 54 12 C72 4 90 22 108 12 C116 8 120 10 120 10 L120 28 L0 28 Z"
              fill="var(--tabbar-wave)"
            />
          </svg>
          <div className="flex items-center justify-between px-1 pt-7 pb-4 md:px-2">
            <div className="flex flex-1 justify-evenly gap-1 pr-1 md:pr-2">
              {leftTabs.map((tab, index) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "flex min-w-[72px] flex-col items-center gap-1 rounded-2xl px-3 py-1 transition",
                    animateTabs ? styles.tabFlyIn : "opacity-0",
                  )}
                  style={buildFlyStyle("left", index)}
                >
                <Icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                    <span
                      className={`block w-full truncate text-[11px] font-semibold whitespace-nowrap leading-tight text-center ${
                        isActive ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="w-16 shrink-0" aria-hidden="true" />

            <div className="flex flex-1 justify-evenly gap-1 pl-1 md:pl-2">
              {rightTabs.map((tab, index) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "flex min-w-[72px] flex-col items-center gap-1 rounded-2xl px-3 py-1 transition",
                    animateTabs ? styles.tabFlyIn : "opacity-0",
                  )}
                  style={buildFlyStyle("right", index)}
                >
                    <Icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                    <span
                      className={`block w-full truncate text-[11px] font-semibold whitespace-nowrap leading-tight text-center ${
                        isActive ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        <button
          onClick={onMicClick}
          className="absolute left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full border-4 bg-gradient-to-br from-primary to-primary/80 text-white shadow-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl active:scale-95"
          style={{ top: buttonTop, borderColor: "var(--tabbar-bg)" }}
        aria-label={t("addTransaction.voiceInput")}
        aria-pressed={isListening}
      >
          {isAIMode ? (
            <span className="absolute -right-2 -top-2 rounded-full bg-primary text-primary-foreground px-2 text-[10px] font-bold shadow-md">
              AI
            </span>
          ) : null}
          <Mic className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
