import { useEffect, useRef } from "react";
import { selectFantasticBackdropQuality } from "@/lib/fantasticBackdropQuality";

type FantasticModeBackdropProps = {
  enabled: boolean;
};

type StarRay = {
  x: number;
  y: number;
  z: number;
  length: number;
  hue: number;
  phaseCos: number;
  phaseSin: number;
  direction: 1 | -1;
};

export function FantasticModeBackdrop({ enabled }: FantasticModeBackdropProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!enabled || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let frame = 0;
    let timer = 0;
    let resizeFrame = 0;
    let width = 0;
    let height = 0;
    let renderScale = 1;
    let radius = 0;
    let centerX = 0;
    let centerY = 0;
    let pointerY = 0;
    let running = true;
    let windowFocused = true;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const quality = selectFantasticBackdropQuality({
      reducedMotion: reduceMotion,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory,
      viewportPixels: window.innerWidth * window.innerHeight,
    });
    const frameDelay = quality.targetFps > 0 ? 1000 / quality.targetFps : 0;
    const rays = Array.from({ length: quality.rayCount }, (_, index) => makeRay(index));

    function resize() {
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);

      const requestedScale = Math.min(window.devicePixelRatio || 1, quality.dprCap);
      const pixelBudgetScale = Math.sqrt(quality.maxBackingPixels / (width * height));
      renderScale = Math.max(0.125, Math.min(requestedScale, pixelBudgetScale));
      radius = Math.max(width, height) * 0.42;
      centerX = width / 2;
      centerY = height * 0.47;

      canvas.width = Math.max(1, Math.floor(width * renderScale));
      canvas.height = Math.max(1, Math.floor(height * renderScale));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
    }

    function render(timeMs: number) {
      if (!running || document.hidden || !windowFocused) return;

      const time = timeMs * 0.00012;
      const tilt = pointerY * 0.00018;
      const pulse = 1 + Math.sin(time * 8) * 0.16;
      const cosTilt = Math.cos(tilt);
      const sinTilt = Math.sin(tilt);
      const cosTime = Math.cos(time);
      const sinTime = Math.sin(time);

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      for (const ray of rays) {
        const y1 = ray.y * cosTilt - ray.z * sinTilt;
        const z1 = ray.y * sinTilt + ray.z * cosTilt;
        const directedSinTime = sinTime * ray.direction;
        const cosAngle = ray.phaseCos * cosTime - ray.phaseSin * directedSinTime;
        const sinAngle = ray.phaseSin * cosTime + ray.phaseCos * directedSinTime;
        const x2 = ray.x * cosAngle - z1 * sinAngle;
        const z2 = ray.x * sinAngle + z1 * cosAngle;
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
      scheduleNext();
    }

    function scheduleNext() {
      if (!running || document.hidden || !windowFocused || quality.targetFps <= 0) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (!running || document.hidden || !windowFocused) return;
        frame = window.requestAnimationFrame(render);
      }, frameDelay);
    }

    function cancelScheduledRender() {
      window.clearTimeout(timer);
      window.cancelAnimationFrame(frame);
    }

    function handleResize() {
      cancelScheduledRender();
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(() => {
        resize();
        render(performance.now());
      });
    }

    function handlePointer(event: PointerEvent) {
      pointerY = event.clientY - window.innerHeight / 2;
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        cancelScheduledRender();
        return;
      }
      scheduleNext();
    }

    function handleWindowBlur() {
      windowFocused = false;
      cancelScheduledRender();
    }

    function handleWindowFocus() {
      windowFocused = true;
      scheduleNext();
    }

    resize();
    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    if (quality.pointerMotion) window.addEventListener("pointermove", handlePointer, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    frame = window.requestAnimationFrame(render);

    return () => {
      running = false;
      cancelScheduledRender();
      window.cancelAnimationFrame(resizeFrame);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
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
  const phase = Math.random() * Math.PI * 2;
  const radial = Math.sqrt(1 - u * u);

  return {
    x: radial * Math.cos(theta),
    y: radial * Math.sin(theta),
    z: u,
    length: Math.random() * 1.6 + 0.35,
    hue: [230, 248, 268, 288, 205][index % 5] + Math.random() * 18,
    phaseCos: Math.cos(phase),
    phaseSin: Math.sin(phase),
    direction: index % 2 === 0 ? 1 : -1,
  };
}
