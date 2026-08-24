import type { ReactNode } from "react";
import type { RhythmicPresetId } from "../../lib/studioPresets";
import type { BackgroundPreset, BallStyle, CourseItemStyle } from "../../types";
import { cn } from "@/lib/utils";

function SceneFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={cn("relative h-20 w-full overflow-hidden rounded-lg", className)}>{children}</div>;
}

export function BallStylePreview({ style }: { style: BallStyle }) {
  const sphere = style === "chrome"
    ? "linear-gradient(145deg, #0d131d 0%, #eef6ff 18%, #6b7788 34%, #f8fbff 52%, #4f5968 70%, #0a0f16 100%)"
    : style === "glass"
      ? "radial-gradient(circle at 32% 28%, rgba(255,255,255,.95) 0 12%, rgba(224,247,255,.7) 18%, rgba(125,210,255,.35) 46%, rgba(92,160,255,.22) 64%, rgba(11,18,40,.75) 100%)"
      : style === "neon"
        ? "radial-gradient(circle at 32% 28%, #ffffff 0 8%, #aaf8ff 15%, #5fe8ff 32%, #2645ff 58%, #080916 100%)"
        : style === "striped"
          ? "linear-gradient(160deg, #fefefe 0 15%, #d7332d 16% 42%, #ffffff 43% 55%, #d7332d 56% 82%, #7e1311 100%)"
          : style === "prism"
            ? "linear-gradient(145deg, #6ffcff 0%, #6573ff 24%, #ff61d4 48%, #ffd45d 72%, #67f0b9 100%)"
            : "radial-gradient(circle at 32% 28%, #ffffff 0 10%, #ffd7d1 20%, #ea564b 46%, #6d1110 100%)";
  const shellGlow = style === "neon" ? "shadow-[0_0_22px_rgba(95,232,255,.55)]" : style === "prism" ? "shadow-[0_0_20px_rgba(130,120,255,.35)]" : "shadow-[0_10px_18px_rgba(15,23,42,.22)]";
  return <SceneFrame className="bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,.24),rgba(0,0,0,0)_45%),linear-gradient(180deg,#0b1220,#151f34)]">
    <div className="absolute inset-x-3 bottom-2 h-3 rounded-full bg-black/25 blur-sm" />
    <div className={cn("absolute left-1/2 top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20", shellGlow)} style={{ background: sphere }}>
      <div className="absolute left-[10px] top-[8px] h-3 w-4 rounded-full bg-white/70 blur-[1px]" />
      {(style === "glass" || style === "prism") && <div className="absolute left-[22px] top-[24px] h-3 w-3 rounded-full bg-white/20 blur-[1px]" />}
      {style === "neon" && <div className="absolute inset-[6px] rounded-full border border-cyan-200/70" />}
    </div>
  </SceneFrame>;
}

function platformPreviewBase(children: ReactNode, background = "bg-[linear-gradient(180deg,#111827,#1f2937)]") {
  return <SceneFrame className={background}>
    <div className="absolute inset-x-0 bottom-0 h-9 bg-[linear-gradient(180deg,rgba(255,255,255,.02),rgba(0,0,0,.26))]" />
    {children}
  </SceneFrame>;
}

export function CourseItemPreview({ style }: { style: CourseItemStyle }) {
  if (style === "neon-bridge") {
    return platformPreviewBase(<>
      <div className="absolute left-2 right-2 top-8 h-1 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,.85)]" />
      <div className="absolute left-2 right-2 top-12 h-1 rounded-full bg-fuchsia-400 shadow-[0_0_12px_rgba(232,121,249,.85)]" />
      <div className="absolute left-4 top-8 h-6 w-px bg-white/35" />
      <div className="absolute left-10 top-8 h-6 w-px bg-white/35" />
      <div className="absolute right-10 top-8 h-6 w-px bg-white/35" />
      <div className="absolute right-4 top-8 h-6 w-px bg-white/35" />
    </>);
  }
  if (style === "stair-flight" || style === "stair-step") {
    return platformPreviewBase(<>
      {[0, 1, 2, 3].map((step) => <div key={step} className="absolute rounded-md border border-cyan-100/20 bg-slate-700/90" style={{ left: `${10 + step * 16}px`, top: `${46 - step * 8}px`, width: "24px", height: "10px", boxShadow: "0 6px 12px rgba(15,23,42,.24)" }} />)}
    </>, "bg-[linear-gradient(180deg,#0f172a,#1e293b)]");
  }
  if (style === "instrument-cymbal") {
    return platformPreviewBase(<>
      <div className="absolute left-1/2 top-[18px] h-10 w-[2px] -translate-x-1/2 bg-slate-500" />
      <div className="absolute left-1/2 top-[14px] h-5 w-12 -translate-x-1/2 rounded-[999px] border border-amber-200/60 bg-[radial-gradient(circle_at_35%_30%,#fff7cf,#d8a85a_45%,#4c3a25)] shadow-[0_12px_18px_rgba(15,23,42,.24)]" />
    </>, "bg-[linear-gradient(180deg,#201511,#332117)]");
  }
  if (style === "instrument-wire") {
    return platformPreviewBase(<>
      <div className="absolute left-3 right-3 top-[28px] h-[2px] rounded-full bg-slate-200/80" />
      <div className="absolute left-3 right-3 top-[42px] h-[2px] rounded-full bg-slate-200/80" />
      {[18, 38, 58].map((x) => <div key={x} className="absolute h-4 w-px bg-slate-300/60" style={{ left: `${x}px`, top: "28px", transform: "rotate(12deg)" }} />)}
    </>, "bg-[linear-gradient(180deg,#121826,#1d2435)]");
  }
  if (style.includes("glass") || style.includes("pipe") || style === "glass" || style === "tube-cylinder" || style === "toy-tube") {
    return platformPreviewBase(<>
      <div className="absolute left-3 right-3 top-[28px] h-6 rounded-full border border-cyan-100/55 bg-[linear-gradient(180deg,rgba(255,255,255,.85),rgba(127,199,255,.25)_38%,rgba(59,130,246,.25)_70%,rgba(12,18,34,.75))] shadow-[0_0_14px_rgba(125,211,252,.25)]" />
      <div className="absolute left-5 right-5 top-[30px] h-2 rounded-full bg-white/45" />
    </>);
  }
  if (style === "toy-peg") {
    return platformPreviewBase(<>
      {[18, 34, 50].map((x) => <div key={x} className="absolute top-[24px] h-8 w-3 rounded-full border border-amber-100/60 bg-[linear-gradient(180deg,#fffdf9,#f2ddc8_60%,#906244)] shadow-[0_8px_16px_rgba(15,23,42,.18)]" style={{ left: `${x}px` }} />)}
    </>, "bg-[linear-gradient(180deg,#43352d,#7c6859)]");
  }
  if (style === "comet-pad") {
    return platformPreviewBase(<>
      <div className="absolute left-3 right-3 top-[22px] h-8 rounded-[999px] border border-violet-200/45 bg-[linear-gradient(180deg,#f9e7ff,#a855f7_40%,#2a1338_100%)] shadow-[0_0_20px_rgba(168,85,247,.35)]" />
      <div className="absolute left-5 right-5 top-[24px] h-2 rounded-full bg-white/50" />
    </>, "bg-[radial-gradient(circle_at_50%_35%,rgba(167,139,250,.18),rgba(7,10,18,0)_55%),linear-gradient(180deg,#06070d,#131728)]");
  }
  if (style === "instrument-key" || style === "xylophone-key" || style === "instrument-pad") {
    const bg = style === "xylophone-key" ? "bg-[linear-gradient(180deg,#25143f,#3d2367)]" : "bg-[linear-gradient(180deg,#161d2c,#262f44)]";
    const keyColor = style === "xylophone-key" ? "linear-gradient(180deg,#fde68a,#f59e0b_55%,#92400e)" : "linear-gradient(180deg,#ffffff,#93c5fd_45%,#1d4ed8_100%)";
    return platformPreviewBase(<>
      <div className="absolute left-[14px] top-[34px] h-3 w-14 rounded-md bg-slate-900/55" />
      <div className="absolute left-[10px] top-[22px] h-7 w-14 rounded-md border border-white/40 shadow-[0_10px_18px_rgba(15,23,42,.22)]" style={{ background: keyColor }} />
      <div className="absolute left-[14px] top-[25px] h-1.5 w-10 rounded-full bg-white/55" />
      <div className="absolute left-[16px] top-[33px] h-1 w-1 rounded-full bg-slate-800/75" />
      <div className="absolute right-[16px] top-[33px] h-1 w-1 rounded-full bg-slate-800/75" />
    </>, bg);
  }
  if (style === "instrument-rail") {
    return platformPreviewBase(<>
      <div className="absolute left-2 right-2 top-[28px] h-4 rounded-full border border-white/40 bg-[linear-gradient(180deg,#ffffff,#b1c5de_45%,#495466)] shadow-[0_10px_18px_rgba(15,23,42,.22)]" />
      <div className="absolute left-1 top-[28px] h-4 w-4 rounded-full border border-slate-400/70 bg-slate-100" />
      <div className="absolute right-1 top-[28px] h-4 w-4 rounded-full border border-slate-400/70 bg-slate-100" />
    </>, "bg-[linear-gradient(180deg,#121b28,#202e40)]");
  }
  if (style === "prism") {
    return platformPreviewBase(<>
      {[0, 1, 2, 3, 4].map((index) => <div key={index} className="absolute top-[26px] h-8 w-4 skew-x-[-18deg] rounded-sm shadow-[0_8px_12px_rgba(15,23,42,.18)]" style={{ left: `${10 + index * 14}px`, background: ["#5eead4", "#60a5fa", "#8b5cf6", "#f472b6", "#fbbf24"][index] }} />)}
    </>, "bg-[linear-gradient(180deg,#111827,#1f2937)]");
  }
  return platformPreviewBase(<>
    <div className="absolute left-3 right-3 top-[27px] h-5 rounded-full border border-cyan-100/30 bg-[linear-gradient(180deg,#22d3ee,#0ea5e9_45%,#082f49)] shadow-[0_0_14px_rgba(34,211,238,.2)]" />
    <div className="absolute left-5 right-5 top-[29px] h-1.5 rounded-full bg-white/55" />
  </>);
}

export function BackgroundPresetPreview({ preset }: { preset: BackgroundPreset }) {
  if (preset === "tube-board-dark") return <SceneFrame className="bg-[linear-gradient(180deg,#6b7280,#3f434d)]">
    <div className="absolute inset-3 rounded-xl border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,.08),rgba(0,0,0,.18))]" />
    {Array.from({ length: 4 }).map((_, col) => <div key={col} className="absolute top-4 bottom-4 w-4 rounded-full border border-slate-200/20 bg-white/10" style={{ left: `${14 + col * 20}px` }} />)}
  </SceneFrame>;
  if (preset === "comet-void") return <SceneFrame className="bg-[radial-gradient(circle_at_50%_40%,rgba(126,201,255,.2),rgba(2,6,23,0)_28%),linear-gradient(180deg,#02040a,#0d1327)]">
    {Array.from({ length: 4 }).map((_, index) => <div key={index} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[999px] border border-cyan-300/35" style={{ width: `${32 + index * 22}px`, height: `${20 + index * 14}px` }} />)}
  </SceneFrame>;
  if (preset === "instrument-room" || preset === "xylophone-room") return <SceneFrame className="bg-[linear-gradient(180deg,#efe8dc,#d0d7e4)]">
    <div className="absolute inset-x-0 bottom-0 h-8 bg-[linear-gradient(180deg,#c79f74,#8c6545)]" style={{ clipPath: "polygon(0 100%,100% 100%,74% 0,26% 0)" }} />
    <div className="absolute inset-x-[16%] bottom-6 h-10 rounded-t-2xl border border-white/35 bg-white/16" />
    <div className="absolute left-[24%] top-[18px] h-5 w-7 rounded-md bg-pink-300/75" />
    <div className="absolute right-[24%] top-[18px] h-5 w-7 rounded-md bg-cyan-300/75" />
  </SceneFrame>;
  if (preset === "toy-board") return <SceneFrame className="bg-[linear-gradient(180deg,#d8c7b3,#9d866d)]">
    <div className="absolute inset-2 rounded-lg bg-[linear-gradient(180deg,#e9dfd1,#d4c1aa)] shadow-[inset_0_0_0_1px_rgba(255,255,255,.35)]" />
    {Array.from({ length: 4 }).map((_, col) => Array.from({ length: 2 }).map((__, row) => <div key={`${col}-${row}`} className="absolute h-2 w-2 rounded-full bg-slate-700/35" style={{ left: `${18 + col * 18}px`, top: `${20 + row * 18}px` }} />))}
  </SceneFrame>;
  if (preset === "pipe-tower" || preset === "tube-tunnel") return <SceneFrame className="bg-[linear-gradient(180deg,#070b15,#111827)]">
    {Array.from({ length: 4 }).map((_, index) => <div key={index} className="absolute top-2 bottom-2 w-4 rounded-full border border-cyan-200/20 bg-white/10" style={{ left: `${10 + index * 18}px` }} />)}
  </SceneFrame>;
  return <SceneFrame className="bg-[linear-gradient(180deg,#0f172a,#1e293b)]">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(34,211,238,.24),rgba(15,23,42,0)_45%)]" />
    <div className="absolute inset-y-0 left-4 w-px bg-white/15" />
    <div className="absolute inset-y-0 left-10 w-px bg-white/10" />
    <div className="absolute inset-x-0 top-[28px] h-px bg-white/12" />
    <div className="absolute inset-x-0 top-[42px] h-px bg-white/8" />
  </SceneFrame>;
}

export function PresetThumbnail({ presetId }: { presetId: RhythmicPresetId }) {
  if (presetId === "wall-orchestra") return <SceneFrame className="h-16 bg-[linear-gradient(180deg,#d7ccc2,#bfb4aa)]">
    {[0,1,2].map((index) => <div key={index} className="absolute h-3 rounded-md shadow-[0_5px_8px_rgba(0,0,0,.24)]" style={{ width: `${32 + index * 7}px`, left: `${10 + index * 18}px`, top: `${12 + index * 14}px`, transform: `rotate(${-18 + index * 16}deg)`, background: ["#2e3338","#f28c4b","#4c8fdc"][index] }} />)}
    <div className="absolute right-3 top-4 h-5 w-5 rounded-full bg-[linear-gradient(145deg,#fff_0_28%,#d9443f_29%_66%,#fff_67%)] shadow-[0_5px_8px_rgba(0,0,0,.25)]" />
    <div className="absolute bottom-2 left-7 h-4 w-4 rounded-full border-2 border-slate-600 bg-slate-300" />
  </SceneFrame>;
  if (presetId === "toy-pegboard") return <SceneFrame className="h-16 bg-[linear-gradient(180deg,#8d8f97,#4b505c)]">
    <div className="absolute inset-2 rounded-xl bg-[linear-gradient(180deg,#6b7280,#464b56)] shadow-[inset_0_0_0_1px_rgba(255,255,255,.08)]" />
    {Array.from({ length: 3 }).map((_, index) => <div key={index} className="absolute top-[18px] h-8 w-6 rounded-full border border-white/20 bg-[linear-gradient(180deg,#faf9f6,#bbb39b_55%,#6f533f)]" style={{ left: `${16 + index * 24}px` }} />)}
    <div className="absolute right-3 top-4 h-5 w-5 rounded-full bg-[linear-gradient(145deg,#ffffff,#ef4444_40%,#7f1d1d)] shadow-[0_0_14px_rgba(239,68,68,.35)]" />
  </SceneFrame>;
  if (presetId === "neon-comet") return <SceneFrame className="h-16 bg-[radial-gradient(circle_at_50%_40%,rgba(96,165,250,.18),rgba(15,23,42,0)_28%),linear-gradient(180deg,#030712,#0f172a)]">
    {Array.from({ length: 3 }).map((_, index) => <div key={index} className="absolute left-[18px] top-[18px] h-4 rounded-[999px] border border-fuchsia-300/45" style={{ width: `${20 + index * 14}px`, transform: `translateX(${index * 10}px) translateY(${index * 5}px)` }} />)}
    <div className="absolute right-4 top-4 h-6 w-6 rounded-full bg-[linear-gradient(145deg,#7dd3fc,#7c3aed_40%,#ec4899_85%)] shadow-[0_0_18px_rgba(236,72,153,.45)]" />
    <div className="absolute left-5 right-14 top-[34px] h-1.5 rounded-full bg-cyan-300/85 blur-[1px]" />
  </SceneFrame>;
  if (presetId === "boomwhacker-wall") return <SceneFrame className="h-16 bg-[linear-gradient(180deg,#d8d2cb,#bcb5ae)]">
    {[0,1,2,3].map((index) => <div key={index} className="absolute h-3 w-10 rounded-full shadow-[0_5px_8px_rgba(0,0,0,.2)]" style={{ left: `${12 + index * 10}px`, top: `${12 + index * 10}px`, transform: `rotate(${18 + index * 7}deg)`, background: ["#f97316","#65a30d","#2563eb","#dc2626"][index] }} />)}
    <div className="absolute right-3 top-3 h-5 w-5 rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff,#7c3aed_45%,#34145c)]" />
  </SceneFrame>;
  if (presetId === "instrument-showcase") return <SceneFrame className="h-16 bg-[linear-gradient(180deg,#d6d0c9,#bdb7b1)]">
    {[0,1,2].map((index) => <div key={index} className="absolute h-3 w-12 rounded-sm shadow-[0_5px_8px_rgba(0,0,0,.18)]" style={{ left: `${10 + index * 18}px`, top: `${15 + index * 12}px`, transform: `rotate(${-12 + index * 13}deg)`, background: index === 0 ? "#9a5d38" : index === 1 ? "#555" : "#4f8de8" }} />)}
    <div className="absolute left-3 bottom-2 h-4 w-4 rounded-full bg-green-500" /><div className="absolute right-4 top-3 h-4 w-4 rounded-full bg-violet-600" />
  </SceneFrame>;
  if (presetId === "vibraphone-wall") return <SceneFrame className="h-16 bg-[linear-gradient(180deg,#d9d5d0,#c3beb8)]">
    {[0,1,2,3].map((index) => <div key={index} className="absolute h-3 w-11 rounded-sm border border-white/30 bg-gradient-to-b from-slate-200 to-slate-500 shadow-[0_5px_8px_rgba(0,0,0,.18)]" style={{ left: `${12 + index * 12}px`, top: `${10 + index * 11}px`, transform: `rotate(${index % 2 ? -8 : 8}deg)` }} />)}
    <div className="absolute right-3 bottom-2 h-4 w-4 rounded-full bg-green-500" />
  </SceneFrame>;
  if (presetId === "percussion-wall") return <SceneFrame className="h-16 bg-[linear-gradient(180deg,#d7ccc2,#bdb2a8)]">
    {[0,1].map((index) => <div key={index} className="absolute h-5 w-9 rounded-md border border-black/20 bg-slate-700 shadow-[0_5px_8px_rgba(0,0,0,.2)]" style={{ left: `${12 + index * 30}px`, top: `${13 + index * 16}px`, transform: `rotate(${index ? 14 : -18}deg)` }} />)}
    <div className="absolute right-3 top-4 h-6 w-6 rounded-full border-4 border-slate-500 bg-slate-200" />
    <div className="absolute bottom-2 left-8 h-4 w-4 rounded-full bg-amber-400" />
  </SceneFrame>;
  if (presetId === "arcade-wall") return <SceneFrame className="h-16 bg-[linear-gradient(180deg,#d7ccc2,#bdb2a8)]">
    {[0,1,2].map((index) => <div key={index} className="absolute h-6 w-7 rounded-md border-2 border-emerald-800 bg-emerald-500 shadow-[0_5px_8px_rgba(0,0,0,.2)]" style={{ left: `${10 + index * 22}px`, top: `${12 + index * 11}px`, transform: `rotate(${index % 2 ? 15 : -12}deg)` }} />)}
    <div className="absolute right-3 bottom-2 h-4 w-4 rounded-full bg-red-500" />
  </SceneFrame>;
  return <SceneFrame className="h-16 bg-[linear-gradient(180deg,#f2ede6,#d0d7e4)]">
    <div className="absolute inset-x-0 bottom-0 h-7 bg-[linear-gradient(180deg,#d3a673,#936846)]" style={{ clipPath: "polygon(0 100%,100% 100%,76% 0,24% 0)" }} />
    {[0, 1, 2].map((index) => <div key={index} className="absolute top-[26px] h-4 w-10 rounded-md border border-white/35 shadow-[0_8px_10px_rgba(15,23,42,.16)]" style={{ left: `${12 + index * 20}px`, background: ["linear-gradient(180deg,#fef08a,#f59e0b)", "linear-gradient(180deg,#a7f3d0,#14b8a6)", "linear-gradient(180deg,#bfdbfe,#3b82f6)"][index] }} />)}
    <div className="absolute right-4 top-4 h-5 w-5 rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff,rgba(255,255,255,.65)_16%,rgba(125,211,252,.45)_42%,rgba(8,47,73,.85))]" />
  </SceneFrame>;
}
