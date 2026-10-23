import { useEffect, useRef } from "react";
import type { Frame } from "@/lib/algorithms";
import type { Lang } from "@/lib/i18n";
import type { Theme } from "@/lib/renderer";
import { drawAlgorithm3DOverlay } from "./drawAlgorithm3DOverlay";

type Props = {
  frame: Frame;
  frameIndex: number;
  frameCount: number;
  transitionProgress: number;
  width: number;
  height: number;
  title: string;
  subtitle: string;
  code: string;
  showCode: boolean;
  complexity?: { time: string; best?: string; worst?: string; space: string };
  lang: Lang;
  theme: Theme;
  storyMode: boolean;
  hyperMode: boolean;
};

/** Uses the exact same Canvas2D overlay renderer as video export. */
export function Algorithm3DPreviewOverlayCanvas(props: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, props.width, props.height);
    drawAlgorithm3DOverlay(ctx, {
      frame: props.frame,
      frameIndex: props.frameIndex,
      frameCount: props.frameCount,
      transitionProgress: props.transitionProgress,
      width: props.width,
      height: props.height,
      title: props.title,
      subtitle: props.subtitle,
      code: props.code,
      showCode: props.showCode,
      complexity: props.complexity,
      lang: props.lang,
      theme: props.theme,
      storyMode: props.storyMode,
      hyperMode: props.hyperMode,
    });
  }, [
    props.code,
    props.complexity,
    props.frame,
    props.frameCount,
    props.frameIndex,
    props.height,
    props.hyperMode,
    props.lang,
    props.showCode,
    props.storyMode,
    props.subtitle,
    props.theme,
    props.title,
    props.transitionProgress,
    props.width,
  ]);

  return (
    <canvas
      ref={ref}
      width={props.width}
      height={props.height}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
