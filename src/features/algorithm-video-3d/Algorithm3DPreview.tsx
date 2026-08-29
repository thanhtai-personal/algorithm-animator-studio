import type { Frame } from "@/lib/algorithms";
import type { Lang } from "@/lib/i18n";
import type { Theme } from "@/lib/renderer";
import { AlgorithmScene3D } from "./AlgorithmScene3D";
import type { AlgorithmVideoAdSelection } from "@/lib/algorithmVideoAds";
import { Algorithm3DPreviewOverlayCanvas } from "./Algorithm3DPreviewOverlayCanvas";
import { videoPreviewViewportStyle } from "@/lib/videoPreviewViewport";

export function Algorithm3DPreview({ frame, previousFrame, frameIndex, transitionProgress, width, height, theme, title, subtitle, code, showCode, complexity, lang, ads, storyMode = false, hyperMode = false, frameCount = 1 }: {
  frame: Frame;
  previousFrame?: Frame | null;
  frameIndex: number;
  transitionProgress: number;
  width: number;
  height: number;
  theme: Theme;
  title: string;
  subtitle: string;
  code: string;
  showCode: boolean;
  complexity?: { time: string; best?: string; worst?: string; space: string };
  lang: Lang;
  ads?: AlgorithmVideoAdSelection;
  storyMode?: boolean;
  hyperMode?: boolean;
  frameCount?: number;
}) {
  return (
    <div
      className="relative mx-auto overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d1419] shadow-[0_20px_70px_rgba(0,0,0,0.55)]"
      style={videoPreviewViewportStyle(width, height)}
    >
      <AlgorithmScene3D
        frame={frame}
        previousFrame={previousFrame}
        frameIndex={frameIndex}
        width={width}
        height={height}
        theme={theme}
        deterministicProgress={transitionProgress}
        ads={ads}
        storyMode={storyMode || hyperMode}
      />
      <Algorithm3DPreviewOverlayCanvas
        frame={frame}
        frameIndex={frameIndex}
        frameCount={frameCount}
        transitionProgress={transitionProgress}
        width={width}
        height={height}
        title={title}
        subtitle={subtitle}
        code={code}
        showCode={showCode}
        complexity={complexity}
        lang={lang}
        theme={theme}
        storyMode={storyMode}
        hyperMode={hyperMode}
      />
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/[0.05]" />
    </div>
  );
}
