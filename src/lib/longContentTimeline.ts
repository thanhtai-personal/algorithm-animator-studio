import { AlgoDef, Complexity } from "./algorithms";
import type { Lang } from "./i18n";
import { getLongContentGuide, pickGuideText } from "./longContentData";

export type LongSceneKind = "intro" | "mental" | "steps" | "animation" | "complexity" | "recap";

export type LongContentScene = {
  id: string;
  kind: LongSceneKind;
  kindLabel: string;
  title: string;
  subtitle: string;
  bullets: string[];
  narration: string;
  durationSec: number;
  animation?: boolean;
};

const KIND_LABELS: Record<LongSceneKind, Record<Lang, string>> = {
  intro: { vi: "Mở đầu", en: "Intro" },
  mental: { vi: "Ý tưởng", en: "Core idea" },
  steps: { vi: "Các bước", en: "Steps" },
  animation: { vi: "Animation", en: "Animation" },
  complexity: { vi: "Độ phức tạp", en: "Complexity" },
  recap: { vi: "Tóm tắt", en: "Recap" },
};

export function buildLongContentScenes(params: {
  algo: AlgoDef;
  complexity?: Complexity;
  animationSeconds: number;
  introSeconds: number;
  lang: Lang;
}) {
  const { algo, complexity, animationSeconds, introSeconds, lang } = params;
  const guide = pickGuideText(getLongContentGuide(algo.id), lang);
  const complexityBullets = [
    complexity?.best ? `Best case: ${complexity.best}` : null,
    complexity?.time ? `${lang === "vi" ? "Trung bình" : "Average"}: ${complexity.time}` : null,
    complexity?.worst ? `Worst case: ${complexity.worst}` : null,
    complexity?.space ? `Space: ${complexity.space}` : null,
    guide.takeaway,
  ].filter(Boolean) as string[];

  const scenes: Omit<LongContentScene, "kindLabel" | "narration">[] = [
    {
      id: "intro",
      kind: "intro",
      title: lang === "vi" ? `${algo.name} giải thích bằng animation` : `${algo.name} explained visually`,
      subtitle: guide.hook,
      bullets: [guide.useCase],
      durationSec: introSeconds,
    },
    {
      id: "mental-model",
      kind: "mental",
      title: lang === "vi" ? "Ý tưởng cốt lõi" : "Core mental model",
      subtitle: guide.mentalModel,
      bullets: guide.watch,
      durationSec: 7,
    },
    {
      id: "steps",
      kind: "steps",
      title: lang === "vi" ? "Các bước chính" : "Main steps",
      subtitle: lang === "vi"
        ? "Xem animation như một timeline: mỗi màu là một tín hiệu xử lý."
        : "Read the animation as a timeline: each color is a processing signal.",
      bullets: guide.steps,
      durationSec: 9,
    },
    {
      id: "animation",
      kind: "animation",
      title: lang === "vi" ? "Chạy thuật toán từng bước" : "Run the algorithm step by step",
      subtitle: lang === "vi"
        ? "Phần này dùng lại animation của short nhưng kéo dài để người xem kịp hiểu."
        : "This reuses the short-form animation, slowed down so viewers can follow the idea.",
      bullets: [...guide.steps, ...guide.watch].slice(0, 5),
      durationSec: animationSeconds,
      animation: true,
    },
    {
      id: "complexity",
      kind: "complexity",
      title: lang === "vi" ? "Độ phức tạp & đánh đổi" : "Complexity and trade-offs",
      subtitle: lang === "vi"
        ? "Không chỉ chạy được, cần biết thuật toán mạnh/yếu ở đâu."
        : "It is not enough that it works; we need to know where it is strong or weak.",
      bullets: complexityBullets,
      durationSec: 8,
    },
    {
      id: "recap",
      kind: "recap",
      title: lang === "vi" ? "Tóm tắt để nhớ nhanh" : "Quick recap",
      subtitle: guide.takeaway,
      bullets: [guide.hook, guide.useCase, lang === "vi" ? "Subscribe để xem thêm animation thuật toán khác." : "Subscribe for more visual algorithm explanations."],
      durationSec: 6,
    },
  ];

  return scenes.map((scene) => ({
    ...scene,
    kindLabel: KIND_LABELS[scene.kind][lang],
    narration: buildNarration(scene.title, scene.subtitle, scene.bullets),
  }));
}

export function getSceneAtTime(scenes: LongContentScene[], elapsedSec: number) {
  let cursor = 0;
  for (const scene of scenes) {
    const start = cursor;
    const end = cursor + scene.durationSec;
    if (elapsedSec <= end) return { scene, start, end, progress: clamp01((elapsedSec - start) / scene.durationSec) };
    cursor = end;
  }
  const last = scenes[scenes.length - 1];
  return { scene: last, start: cursor - (last?.durationSec ?? 0), end: cursor, progress: 1 };
}

export function getTotalDuration(scenes: LongContentScene[]) {
  return scenes.reduce((sum, scene) => sum + scene.durationSec, 0);
}

function buildNarration(title: string, subtitle: string, bullets: string[]) {
  return [title, subtitle, ...bullets].filter(Boolean).join(". ");
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}
