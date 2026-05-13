import { AlgoDef, Complexity } from "./algorithms";
import { getLongContentGuide } from "./longContentData";

export type LongSceneKind = "intro" | "mental" | "steps" | "animation" | "complexity" | "recap";

export type LongContentScene = {
  id: string;
  kind: LongSceneKind;
  title: string;
  subtitle: string;
  bullets: string[];
  durationSec: number;
  animation?: boolean;
};

export function buildLongContentScenes(params: {
  algo: AlgoDef;
  complexity?: Complexity;
  animationSeconds: number;
  introSeconds: number;
}) {
  const { algo, complexity, animationSeconds, introSeconds } = params;
  const guide = getLongContentGuide(algo.id);
  const complexityBullets = [
    complexity?.best ? `Best case: ${complexity.best}` : null,
    complexity?.time ? `Average/Time: ${complexity.time}` : null,
    complexity?.worst ? `Worst case: ${complexity.worst}` : null,
    complexity?.space ? `Space: ${complexity.space}` : null,
    guide.takeaway,
  ].filter(Boolean) as string[];

  return [
    {
      id: "intro",
      kind: "intro" as const,
      title: `${algo.name} explained visually`,
      subtitle: guide.hook,
      bullets: [guide.useCase],
      durationSec: introSeconds,
    },
    {
      id: "mental-model",
      kind: "mental" as const,
      title: "Ý tưởng cốt lõi",
      subtitle: guide.mentalModel,
      bullets: guide.watch,
      durationSec: 7,
    },
    {
      id: "steps",
      kind: "steps" as const,
      title: "Các bước chính",
      subtitle: "Xem animation như một timeline: mỗi màu là một tín hiệu xử lý.",
      bullets: guide.steps,
      durationSec: 9,
    },
    {
      id: "animation",
      kind: "animation" as const,
      title: "Chạy thuật toán từng bước",
      subtitle: "Phần này dùng lại animation của short nhưng kéo dài để người xem kịp hiểu.",
      bullets: [...guide.steps, ...guide.watch].slice(0, 5),
      durationSec: animationSeconds,
      animation: true,
    },
    {
      id: "complexity",
      kind: "complexity" as const,
      title: "Độ phức tạp & đánh đổi",
      subtitle: "Không chỉ chạy được, cần biết thuật toán mạnh/yếu ở đâu.",
      bullets: complexityBullets,
      durationSec: 8,
    },
    {
      id: "recap",
      kind: "recap" as const,
      title: "Tóm tắt để nhớ nhanh",
      subtitle: guide.takeaway,
      bullets: [guide.hook, guide.useCase, "Subscribe để xem thêm animation thuật toán khác."],
      durationSec: 6,
    },
  ];
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

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}
