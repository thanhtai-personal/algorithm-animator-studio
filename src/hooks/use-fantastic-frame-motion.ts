import { useEffect } from "react";

const ENTRANCE_SELECTOR = [
  ".fantastic-mode header",
  ".fantastic-mode main > *",
  ".fantastic-mode main section",
  ".fantastic-mode main aside",
  ".fantastic-mode [role='tablist']",
  ".fantastic-mode [role='tab']",
  ".fantastic-mode button",
  ".fantastic-mode a",
  ".fantastic-mode input",
  ".fantastic-mode textarea",
  ".fantastic-mode [role='combobox']",
  ".fantastic-mode [class*='rounded-lg'][class*='border']",
  ".fantastic-mode [class*='rounded-xl'][class*='border']",
  ".fantastic-mode [class*='rounded-2xl'][class*='border']",
].join(",");

export function useFantasticFrameMotion(enabled: boolean, routeKey = "") {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      clearEntranceMarkers();
      return;
    }

    // One decoration pass per route is enough. Do not observe the whole DOM:
    // editors/timelines mutate frequently and a cosmetic observer used to turn
    // those updates into repeated full-document AOS.refreshHard() scans.
    const frame = window.requestAnimationFrame(markEntrance);

    return () => {
      window.cancelAnimationFrame(frame);
      clearEntranceMarkers();
    };
  }, [enabled, routeKey]);
}

function markEntrance() {
  let order = 0;
  document.querySelectorAll<HTMLElement>(ENTRANCE_SELECTOR).forEach((element) => {
    if (element.closest("[data-radix-popper-content-wrapper]")) return;
    if (element.dataset.fantasticEnter) return;
    if (element.offsetParent === null && element.getBoundingClientRect().width === 0) return;
    const rect = element.getBoundingClientRect();
    element.dataset.fantasticEnter = getEntranceDirection(element, rect, order);
    element.style.setProperty("--fantastic-enter-delay", `${Math.min(order * 24, 360)}ms`);
    order += 1;
  });
}

function getEntranceDirection(element: HTMLElement, rect: DOMRect, index: number) {
  const tagName = element.tagName.toLowerCase();
  if (tagName === "button" || tagName === "a" || element.getAttribute("role") === "tab") return "pop";
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  if (centerY < window.innerHeight * 0.28) return "top";
  if (centerX < window.innerWidth * 0.38) return "left";
  if (centerX > window.innerWidth * 0.62) return "right";
  return index % 2 === 0 ? "bottom" : "top";
}

function clearEntranceMarkers() {
  document.querySelectorAll<HTMLElement>("[data-fantastic-enter]").forEach((element) => {
    delete element.dataset.fantasticEnter;
    element.style.removeProperty("--fantastic-enter-delay");
  });
}
