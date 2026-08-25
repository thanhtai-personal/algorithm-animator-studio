import { useEffect, useRef, useState } from "react";
import { Sprite } from "@/lib/sprites/Sprite";
import type { AnimalSpriteEntry } from "@/lib/animalColumns";

const PREVIEW_WIDTH = 160;
const PREVIEW_HEIGHT = 112;

export function AnimalSpritePreview({ entry }: { entry: AnimalSpriteEntry }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([result]) => {
      if (!result.isIntersecting) return;
      setVisible(true);
      observer.disconnect();
    }, { rootMargin: "160px" });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || typeof Image === "undefined") return undefined;
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled || !canvasRef.current) return;
      const context = canvasRef.current.getContext("2d");
      if (!context) return;
      const sprite = new Sprite({ image, actions: entry.actions, defaultAction: "idle" });
      context.clearRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
      sprite.draw(context, 12, 5, { width: PREVIEW_WIDTH - 24, height: PREVIEW_HEIGHT - 10 });
    };
    image.src = entry.src;
    return () => {
      cancelled = true;
      image.onload = null;
    };
  }, [entry, visible]);

  return <div
    ref={frameRef}
    data-marble-avatar-preview
    className="relative h-20 w-full overflow-hidden rounded-lg bg-[radial-gradient(circle_at_50%_35%,#23334d,#0b1220)]"
  >
    <div className="absolute inset-x-[22%] bottom-1 h-3 rounded-full bg-black/35 blur-sm" />
    <canvas
      ref={canvasRef}
      width={PREVIEW_WIDTH}
      height={PREVIEW_HEIGHT}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_5px_5px_rgba(0,0,0,.35)]"
    />
  </div>;
}
