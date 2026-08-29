import type { Frame } from "@/lib/algorithms";
import type { Lang } from "@/lib/i18n";
import type { Theme } from "@/lib/renderer";
import { getAlgorithm3DStoryState } from "./algorithm3dStory";

export function AlgorithmStoryOverlay({ frame, frameIndex, frameCount, title, lang, theme, transitionProgress = 1 }: {
  frame: Frame;
  frameIndex: number;
  frameCount: number;
  title: string;
  lang: Lang;
  theme: Theme;
  transitionProgress?: number;
}) {
  const story = getAlgorithm3DStoryState({ frame, frameIndex, frameCount, title, lang, transitionProgress });
  const earlyHook = frameIndex <= 1 && frameCount > 3;
  const visible = earlyHook
    ? getAlgorithm3DStoryState({ frame, frameIndex, frameCount, title, lang, hook: true, transitionProgress })
    : story;
  const progressPercent = Math.round(story.progress * 100);

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[26%] bg-gradient-to-b from-black/55 via-black/18 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[24%] bg-gradient-to-t from-black/58 via-black/12 to-transparent" />

      <header className="pointer-events-none absolute left-4 right-4 top-4 flex items-start justify-between gap-4 sm:left-5 sm:right-5 sm:top-5">
        <div className="min-w-0">
          <div className="text-[8px] font-black uppercase tracking-[0.28em] text-white/48 sm:text-[9px]">3D STORY · RETENTION</div>
          <div className="mt-1 truncate text-xs font-bold text-white/78 sm:text-sm">{title}</div>
        </div>
        <div className="rounded-full border border-white/10 bg-black/45 px-2.5 py-1 text-[8px] font-black tracking-[0.14em] text-white/64 sm:text-[9px]">
          {progressPercent}%
        </div>
      </header>

      <div className={`pointer-events-none absolute left-1/2 top-[14%] w-[88%] -translate-x-1/2 text-center transition-opacity duration-200 sm:w-[76%] ${visible.complete ? "top-[19%]" : ""}`}>
        <div className="text-[8px] font-black uppercase tracking-[0.30em] sm:text-[10px]" style={{ color: visible.complete ? theme.sorted : frame.event === "swap" ? theme.swap : theme.highlight }}>
          {visible.kicker}
        </div>
        <div className={`mt-1 font-black tracking-[-0.035em] text-white drop-shadow-[0_3px_18px_rgba(0,0,0,0.72)] ${visible.complete ? "text-xl sm:text-4xl" : earlyHook ? "text-lg sm:text-3xl" : "text-base sm:text-2xl"}`}>
          {visible.headline}
        </div>
        <div className="mx-auto mt-1 max-w-[90%] text-[9px] font-semibold text-white/58 sm:text-xs">{visible.detail}</div>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 right-4 sm:bottom-5 sm:left-5 sm:right-5">
        <div className="mb-1.5 flex items-center justify-between text-[7px] font-black uppercase tracking-[0.16em] text-white/44 sm:text-[8px]">
          <span>{lang === "vi" ? "Tiến độ khôi phục" : "City restoration"}</span>
          <span>{story.completed}/{Math.max(1, frame.arr.length)} {lang === "vi" ? "đã khóa" : "locked"}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/[0.05]">
          <div
            className="h-full rounded-full transition-[width] duration-200"
            style={{ width: `${Math.max(2, progressPercent)}%`, background: `linear-gradient(90deg, ${theme.highlight}, ${theme.sorted})`, boxShadow: `0 0 12px ${theme.sorted}55` }}
          />
        </div>
      </div>
    </>
  );
}
