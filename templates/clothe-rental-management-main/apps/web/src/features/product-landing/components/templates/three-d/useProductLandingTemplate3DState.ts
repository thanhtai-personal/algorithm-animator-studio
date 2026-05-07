"use client";

import { useEffect, useRef, useState } from "react";
import type { PaletteMode, ThemeMode } from "./productLandingTemplate3D.config";
import { useProductLandingTemplate3DAppearance } from "./useProductLandingTemplate3DAppearance";

export function useProductLandingTemplate3DState(
  hideTemplateHeader: boolean,
  defaults?: { mode?: ThemeMode; palette?: PaletteMode; initialSearch?: string }
) {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(defaults?.initialSearch?.trim() ?? "");
  const { mode, palette, setMode, setPalette, themeStyle } =
    useProductLandingTemplate3DAppearance();

  useEffect(() => {
    if (hideTemplateHeader) return;

    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hideTemplateHeader]);

  useEffect(() => {
    const root = pageRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("kata3d-visible");
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    const observed = new WeakSet<HTMLElement>();
    const observeAnimatedNodes = () => {
      const nodes = root.querySelectorAll<HTMLElement>(".kata3d-animate-on-scroll");
      for (const node of nodes) {
        if (observed.has(node)) continue;
        observed.add(node);
        observer.observe(node);
      }
    };

    observeAnimatedNodes();

    const mutationObserver = new MutationObserver(() => {
      observeAnimatedNodes();
    });
    mutationObserver.observe(root, {
      childList: true,
      subtree: true,
    });

    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, []);

  return {
    menuOpen,
    mode,
    pageRef,
    palette,
    scrolled,
    searchQuery,
    settingsOpen,
    setMenuOpen,
    setMode,
    setPalette,
    setSearchQuery,
    setSettingsOpen,
    themeStyle,
  };
}
