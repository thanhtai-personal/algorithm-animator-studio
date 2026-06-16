import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

const FRAME_SELECTOR = [
  ".fantastic-mode main > section",
  ".fantastic-mode main > div > section",
  ".fantastic-mode main > div > aside",
  ".fantastic-mode .auth-card",
  ".fantastic-mode .auth-hero",
  ".fantastic-mode .runtime-loading-card",
  ".fantastic-mode .kai-agent-flow-card",
  ".fantastic-mode [class*='rounded-lg'][class*='border'][class*='bg-card']",
  ".fantastic-mode [class*='rounded-xl'][class*='border'][class*='bg-card']",
  ".fantastic-mode [class*='rounded-2xl'][class*='border'][class*='bg-card']",
].join(",");

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
      clearAosMarkers();
      clearEntranceMarkers();
      return;
    }

    let active = true;
    const markFrames = () => {
      if (!active) return;
      document.querySelectorAll<HTMLElement>(FRAME_SELECTOR).forEach((element, index) => {
        if (element.closest("[data-radix-popper-content-wrapper]")) return;
        if (element.dataset.aos) return;
        element.dataset.aos = index % 2 === 0 ? "fade-up" : "fade-left";
        element.dataset.aosDuration = "520";
        element.dataset.aosEasing = "ease-out-cubic";
        element.dataset.aosOnce = "false";
        element.dataset.aosAnchorPlacement = "top-bottom";
      });
      markEntrance();
      AOS.refreshHard();
    };

    AOS.init({
      disable: () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      duration: 520,
      easing: "ease-out-cubic",
      offset: 24,
      once: false,
      mirror: false,
    });

    window.requestAnimationFrame(markFrames);
    const observer = new MutationObserver(markFrames);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      active = false;
      observer.disconnect();
      clearAosMarkers();
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
    element.style.setProperty("--fantastic-enter-delay", `${Math.min(order * 24, 520)}ms`);
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

function clearAosMarkers() {
  document.querySelectorAll<HTMLElement>("[data-aos]").forEach((element) => {
    delete element.dataset.aos;
    delete element.dataset.aosDuration;
    delete element.dataset.aosEasing;
    delete element.dataset.aosOnce;
    delete element.dataset.aosAnchorPlacement;
    element.classList.remove("aos-init", "aos-animate");
  });
}

function clearEntranceMarkers() {
  document.querySelectorAll<HTMLElement>("[data-fantastic-enter]").forEach((element) => {
    delete element.dataset.fantasticEnter;
    element.style.removeProperty("--fantastic-enter-delay");
  });
}
