"use client";

import { useEffect, useState } from "react";

export function useScrollRevealModern(targetId: string, threshold = 0.15) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isVisible) return;

    const element = document.getElementById(targetId);
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setIsVisible(true);
        observer.unobserve(element);
      },
      { threshold, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [isVisible, targetId, threshold]);

  return isVisible;
}
