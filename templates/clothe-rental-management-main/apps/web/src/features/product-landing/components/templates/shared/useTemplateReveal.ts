"use client";

import { useEffect, useRef } from "react";

export function useTemplateReveal(selector = ".kata-reveal") {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const nodes = Array.from(root.querySelectorAll<HTMLElement>(selector));
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const node = entry.target as HTMLElement;
          node.classList.add("kata-reveal-visible");
          observer.unobserve(node);
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -48px 0px" }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [selector]);

  return rootRef;
}
