import { COMPLEXITY, type Frame } from "@/lib/algorithms";
import type { AnimalColumnSettings } from "@/lib/animalColumns";
import type { Lang } from "@/lib/i18n";
import { renderFrame, type Theme } from "@/lib/renderer";
import { renderShortKineticTypography } from "@/lib/shortKineticTypographyRenderer";
import type { ShortVideoType } from "@/lib/shortVideoTypes";

type Params = {
  ctx: CanvasRenderingContext2D;
  frame: Frame;
  previousFrame: Frame | null;
  frameIndex: number;
  frameCount: number;
  transitionProgress: number;
  width: number;
  height: number;
  shortVideoType: ShortVideoType;
  algorithmId: string;
  algoName: string;
  lang: Lang;
  title: string;
  subtitle: string;
  theme: Theme;
  code: string;
  showCode: boolean;
  animalColumns: AnimalColumnSettings;
};

export function renderStudioPreview(params: Params) {
  if (params.shortVideoType === "kinetic-typography") {
    renderShortKineticTypography(params.ctx, {
      frame: params.frame,
      previousFrame: params.previousFrame,
      frameIndex: params.frameIndex,
      frameCount: params.frameCount,
      transitionProgress: params.transitionProgress,
      algorithmId: params.algorithmId,
      algoName: params.algoName,
      lang: params.lang,
      title: params.title,
      subtitle: params.subtitle,
    }, params.width, params.height);
    return;
  }
  renderFrame(params.ctx, params.frame, {
    title: params.title,
    subtitle: params.subtitle,
    theme: params.theme,
    code: params.code,
    showCode: params.showCode,
    complexity: COMPLEXITY[params.algorithmId],
    previousFrame: params.previousFrame,
    transitionProgress: params.transitionProgress,
    algorithmId: params.algorithmId,
    animalColumns: params.animalColumns,
  }, params.width, params.height);
}
