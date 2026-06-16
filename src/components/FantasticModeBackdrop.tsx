import { useEffect, useRef } from "react";

type FantasticModeBackdropProps = {
  enabled: boolean;
};

type StarRay = {
  x: number;
  y: number;
  z: number;
  length: number;
  hue: number;
  phase: number;
};

export function FantasticModeBackdrop({ enabled }: FantasticModeBackdropProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!enabled || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let pointerY = 0;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rays = Array.from({ length: reduceMotion ? 260 : 720 }, (_, index) => makeRay(index));

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(timeMs: number) {
      const time = timeMs * 0.00012;
      const radius = Math.max(width, height) * 0.42;
      const centerX = width / 2;
      const centerY = height * 0.47;
      const tilt = pointerY * 0.00018;
      const pulse = 1 + Math.sin(time * 8) * 0.16;

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      for (const ray of rays) {
        const y1 = ray.y * Math.cos(tilt) - ray.z * Math.sin(tilt);
        const z1 = ray.y * Math.sin(tilt) + ray.z * Math.cos(tilt);
        const angle = time * (ray.phase % 2 ? -1 : 1) + ray.phase;
        const x2 = ray.x * Math.cos(angle) - z1 * Math.sin(angle);
        const z2 = ray.x * Math.sin(angle) + z1 * Math.cos(angle);
        const depth = (z2 + 1.45) / 2.9;
        const scale = pulse * (0.52 + depth * 0.72);
        const startX = centerX + x2 * radius * scale;
        const startY = centerY + y1 * radius * scale;
        const endX = centerX + x2 * radius * (scale + ray.length * 0.025);
        const endY = centerY + y1 * radius * (scale + ray.length * 0.025);
        const alpha = 0.06 + depth * 0.18;

        ctx.strokeStyle = `hsla(${ray.hue}, 92%, ${58 + depth * 18}%, ${alpha})`;
        ctx.lineWidth = 0.7 + depth * 1.1;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }

      ctx.globalCompositeOperation = "source-over";
      frame = window.requestAnimationFrame(draw);
    }

    function handlePointer(event: PointerEvent) {
      pointerY = event.clientY - window.innerHeight / 2;
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointer, { passive: true });
    frame = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointer);
    };
  }, [enabled]);

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
      <canvas ref={canvasRef} className="fantastic-universe" />
      <div className="fantastic-orb fantastic-orb-a" />
      <div className="fantastic-orb fantastic-orb-b" />
      <div className="fantastic-beam" />
      <div className="fantastic-pulse" />
      <div className="fantastic-noise" />
    </div>
  );
}

function makeRay(index: number): StarRay {
  const u = Math.random() * 2 - 1;
  const theta = Math.random() * Math.PI * 2;
  const radial = Math.sqrt(1 - u * u);

  return {
    x: radial * Math.cos(theta),
    y: radial * Math.sin(theta),
    z: u,
    length: Math.random() * 1.6 + 0.35,
    hue: [230, 248, 268, 288, 205][index % 5] + Math.random() * 18,
    phase: Math.random() * Math.PI * 2,
  };
}
