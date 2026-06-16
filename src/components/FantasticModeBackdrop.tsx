import { useEffect, useRef } from "react";

type FantasticModeBackdropProps = {
  enabled: boolean;
};

export function FantasticModeBackdrop({ enabled }: FantasticModeBackdropProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled || !rootRef.current) return;

    let cancelled = false;
    let revertContext: (() => void) | null = null;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    async function setupAnimation() {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);

      if (cancelled || !rootRef.current) return;

      gsap.registerPlugin(ScrollTrigger);
      const ctx = gsap.context(() => {
        gsap.set(".fantastic-orb", { transformOrigin: "50% 50%" });

        if (!reduceMotion) {
          gsap.to(".fantastic-orb-a", {
            x: "18vw",
            y: "10vh",
            scale: 1.18,
            duration: 9,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          });
          gsap.to(".fantastic-orb-b", {
            x: "-14vw",
            y: "12vh",
            scale: 0.88,
            duration: 11,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          });
          gsap.to(".fantastic-beam", {
            xPercent: 36,
            opacity: 0.82,
            duration: 7,
            repeat: -1,
            yoyo: true,
            ease: "power1.inOut",
          });
          gsap.to(".fantastic-pulse", {
            rotate: 360,
            duration: 28,
            repeat: -1,
            ease: "none",
          });
        }

        gsap.to(rootRef.current, {
          "--fantastic-scroll": 1,
          ease: "none",
          scrollTrigger: {
            trigger: document.documentElement,
            start: "top top",
            end: "max",
            scrub: 0.7,
          },
        });
      }, rootRef);

      revertContext = () => ctx.revert();
    }

    void setupAnimation();

    return () => {
      cancelled = true;
      if (revertContext) {
        revertContext();
      }
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div ref={rootRef} className="fantastic-backdrop" aria-hidden="true">
      <div className="fantastic-orb fantastic-orb-a" />
      <div className="fantastic-orb fantastic-orb-b" />
      <div className="fantastic-beam" />
      <div className="fantastic-pulse" />
      <div className="fantastic-noise" />
    </div>
  );
}
