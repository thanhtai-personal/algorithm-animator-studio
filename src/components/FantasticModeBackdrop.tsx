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

const MAX_BACKING_PIXELS = 3_200_000;
const DEFAULT_RAY_COUNT = 240;
const LOW_POWER_RAY_COUNT = 160;
const REDUCED_MOTION_RAY_COUNT = 96;

export function FantasticModeBackdrop({ enabled }: FantasticModeBackdropProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!enabled || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let frame = 0;
    let timer = 0;
    let width = 0;
    let height = 0;
    let renderScale = 1;
    let pointerY = 0;
    let running = true;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowPower = typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4;
    const rayCount = reduceMotion ? REDUCED_MOTION_RAY_COUNT : lowPower ? LOW_POWER_RAY_COUNT : DEFAULT_RAY_COUNT;
    const targetFps = reduceMotion ? 12 : lowPower ? 24 : 30;
    const frameDelay = 1000 / targetFps;
    const rays = Array.from({ length: rayCount }, (_, index) => makeRay(index));

    function resize() {
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);

      const dprCap = reduceMotion || lowPower ? 1 : 1.25;
      const requestedScale = Math.min(window.devicePixelRatio || 1, dprCap);
      const pixelBudgetScale = Math.sqrt(MAX_BACKING_PIXELS / (width * height));
      renderScale = Math.max(0.25, Math.min(requestedScale, pixelBudgetScale));

      canvas.width = Math.max(1, Math.floor(width * renderScale));
      canvas.height = Math.max(1, Math.floor(height * renderScale));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
    }

    function render(timeMs: number) {
      if (!running || document.hidden) return;

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
        const alpha = 0.05 + depth * 0.14;

        ctx.strokeStyle = `hsla(${ray.hue}, 92%, ${58 + depth * 18}%, ${alpha})`;
        ctx.lineWidth = 0.65 + depth * 0.9;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }

      ctx.globalCompositeOperation = "source-over";
      if (!reduceMotion) scheduleNext();
    }

    function scheduleNext() {
      if (!running || document.hidden || reduceMotion) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (!running || document.hidden) return;
        frame = window.requestAnimationFrame(render);
      }, frameDelay);
    }

    function handlePointer(event: PointerEvent) {
      pointerY = event.clientY - window.innerHeight / 2;
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        window.clearTimeout(timer);
        window.cancelAnimationFrame(frame);
        return;
      }
      if (!reduceMotion) scheduleNext();
    }

    resize();
    window.addEventListener("resize", resize, { passive: true });
    if (!reduceMotion) window.addEventListener("pointermove", handlePointer, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    frame = window.requestAnimationFrame(render);

    return () => {
      running = false;
      window.clearTimeout(timer);
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="fantastic-backdrop" aria-hidden="true">
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
