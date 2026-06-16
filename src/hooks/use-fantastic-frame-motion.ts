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

export function useFantasticFrameMotion(enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      clearAosMarkers();
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
    };
  }, [enabled]);
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
