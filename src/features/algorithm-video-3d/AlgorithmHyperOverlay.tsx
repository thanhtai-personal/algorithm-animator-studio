import type { Frame } from "@/lib/algorithms";
import type { Lang } from "@/lib/i18n";
import type { Theme } from "@/lib/renderer";
import { getAlgorithm3DHyperState } from "./algorithm3dHyper";

export function AlgorithmHyperOverlay({ frame, frameIndex, frameCount, lang, theme, transitionProgress = 1 }: {
  frame: Frame;
  frameIndex: number;
  frameCount: number;
  lang: Lang;
  theme: Theme;
  transitionProgress?: number;
}) {
  const state = getAlgorithm3DHyperState({ frame, frameIndex, frameCount, lang, transitionProgress });
  const percent = Math.round(state.progress * 100);
  const accent = state.role === "finish" ? theme.sorted : state.role === "swap" ? theme.swap : theme.highlight;
  const cutFlash = state.cut ? Math.max(0, 1 - transitionProgress / 0.28) : 0;
  const punch = 1 + Math.sin(Math.min(1, transitionProgress) * Math.PI) * (state.role === "swap" ? 0.055 : 0.035);

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[20%] bg-gradient-to-b from-black/52 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[18%] bg-gradient-to-t from-black/58 to-transparent" />
      {cutFlash > 0 ? <div className="pointer-events-none absolute inset-0 bg-white" style={{ opacity: cutFlash * 0.22 }} /> : null}

      <div className="pointer-events-none absolute left-4 right-4 top-4 flex items-center justify-between sm:left-5 sm:right-5 sm:top-5">
        <div className="rounded-full border border-white/10 bg-black/42 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.20em] text-white/58 sm:text-[9px]">
          3D HYPER · SHORTS
        </div>
        <div className="rounded-full border border-white/10 bg-black/48 px-2.5 py-1 text-[8px] font-black text-white/76 sm:text-[9px]">
          {state.completed}/{state.total}
        </div>
      </div>

      <div className="pointer-events-none absolute left-1/2 top-[13%] w-[90%] -translate-x-1/2 text-center" style={{ transform: `translateX(-50%) scale(${punch})` }}>
        <div className="text-[8px] font-black uppercase tracking-[0.32em] sm:text-[10px]" style={{ color: accent }}>{state.kicker}</div>
        <div className="mt-0.5 text-2xl font-black tracking-[-0.055em] text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.78)] sm:text-5xl">{state.headline}</div>
        <div className="mt-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-white/58 sm:text-xs">{state.detail}</div>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 right-4 sm:bottom-5 sm:left-5 sm:right-5">
        <div className="mb-1 flex justify-between text-[7px] font-black uppercase tracking-[0.14em] text-white/42 sm:text-[8px]">
          <span>{state.role === "finish" ? "DONE" : "LOCK"}</span><span>{percent}%</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full" style={{ width: `${Math.max(2, percent)}%`, background: `linear-gradient(90deg, ${theme.highlight}, ${theme.sorted})` }} />
        </div>
      </div>
    </>
  );
}
