import type { ReactNode } from "react";
import type { RhythmicPresetId } from "../../lib/studioPresets";
import type { ReferenceVideoPresetId } from "../../lib/referenceVideoPresets";
import type { BackgroundPreset, BallStyle, CourseItemStyle, MarbleAvatar } from "../../types";
import { marbleAvatarEntry } from "../../lib/marbleAvatars";
import { cn } from "@/lib/utils";
import { AnimalSpritePreview } from "./MarbleAvatarPreview";

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
        : style === "fire"
          ? "radial-gradient(circle at 34% 30%, #ffffff 0 7%, #fff59d 14%, #ffb000 36%, #f13b14 68%, #5b0904 100%)"
          : style === "water"
            ? "radial-gradient(circle at 30% 25%, #ffffff 0 9%, #c9fbff 17%, #37dff2 42%, #138bc8 68%, #073457 100%)"
            : style === "patchwork"
              ? "radial-gradient(circle at 32% 28%,rgba(255,255,255,.46),rgba(255,255,255,0)_28%),conic-gradient(from 18deg,#22c8e8,#2c70ed,#6346d8,#ff3cad,#ef3340,#ffb11b,#21c56b,#22c8e8)"
            : style === "multicolor-glass"
              ? "radial-gradient(circle at 30% 24%,rgba(255,255,255,.98) 0 8%,rgba(222,252,242,.55) 16%,rgba(97,181,167,.2) 48%,rgba(20,77,91,.38) 76%,rgba(4,17,28,.78) 100%)"
            : style === "rainbow"
              ? "conic-gradient(from 35deg,#ff3b30,#ffcc00,#34c759,#22d3ee,#3478f6,#af52de,#ff3b30)"
              : style === "flower"
                ? "radial-gradient(circle at 32% 28%,#fff 0 8%,#ffdc73 14%,#ff6b3d 42%,#a91f2a 100%)"
        : style === "striped"
          ? "linear-gradient(160deg, #fefefe 0 15%, #d7332d 16% 42%, #ffffff 43% 55%, #d7332d 56% 82%, #7e1311 100%)"
          : style === "prism"
            ? "linear-gradient(145deg, #6ffcff 0%, #6573ff 24%, #ff61d4 48%, #ffd45d 72%, #67f0b9 100%)"
            : "radial-gradient(circle at 32% 28%, #ffffff 0 10%, #ffd7d1 20%, #ea564b 46%, #6d1110 100%)";
  const shellGlow = style === "neon" || style === "water" ? "shadow-[0_0_22px_rgba(95,232,255,.55)]" : style === "fire" ? "shadow-[0_0_24px_rgba(255,91,24,.65)]" : style === "prism" || style === "rainbow" ? "shadow-[0_0_20px_rgba(130,120,255,.35)]" : "shadow-[0_10px_18px_rgba(15,23,42,.22)]";
  return <SceneFrame className="bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,.24),rgba(0,0,0,0)_45%),linear-gradient(180deg,#0b1220,#151f34)]">
    <div className="absolute inset-x-3 bottom-2 h-3 rounded-full bg-black/25 blur-sm" />
    <div className={cn("absolute left-1/2 top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20", shellGlow)} style={{ background: sphere }}>
      <div className="absolute left-[10px] top-[8px] h-3 w-4 rounded-full bg-white/70 blur-[1px]" />
      {(style === "glass" || style === "prism") && <div className="absolute left-[22px] top-[24px] h-3 w-3 rounded-full bg-white/20 blur-[1px]" />}
      {style === "neon" && <div className="absolute inset-[6px] rounded-full border border-cyan-200/70" />}
      {style === "flower" && <><div className="absolute left-[17px] top-[17px] h-3 w-3 rounded-full bg-yellow-300" />{[0, 1, 2, 3, 4].map((index) => <span key={index} className="absolute left-[18px] top-[11px] h-3 w-2 origin-[3px_11px] rounded-full bg-white/90" style={{ transform: `rotate(${index * 72}deg)` }} />)}</>}
      {style === "fire" && <div className="absolute inset-[7px] rounded-full border-2 border-orange-200/70 shadow-[inset_0_0_10px_rgba(255,255,255,.8)]" />}
      {style === "water" && <><div className="absolute inset-[5px] rounded-full border border-cyan-100/75" /><div className="absolute bottom-[9px] right-[8px] h-2 w-2 rounded-full border border-white/70" /></>}
      {style === "rainbow" && <div className="absolute inset-[5px] rounded-full border border-white/45 bg-white/10" />}
      {style === "patchwork" && <>
        <span className="absolute left-[4px] top-[7px] h-4 w-5 bg-amber-400/95" style={{ clipPath: "polygon(24% 0,100% 18%,82% 100%,0 72%)" }} />
        <span className="absolute right-[3px] top-[10px] h-5 w-5 bg-blue-600/95" style={{ clipPath: "polygon(10% 8%,82% 0,100% 72%,38% 100%)" }} />
        <span className="absolute bottom-[3px] left-[8px] h-5 w-5 bg-fuchsia-500/95" style={{ clipPath: "polygon(0 12%,78% 0,100% 70%,38% 100%)" }} />
        <span className="absolute bottom-[4px] right-[6px] h-4 w-5 bg-emerald-500/95" style={{ clipPath: "polygon(18% 0,100% 20%,80% 100%,0 76%)" }} />
      </>}
      {style === "multicolor-glass" && <>
        <div
          data-marble-core="multicolor-glass"
          className="absolute inset-[8px] rotate-[-18deg] rounded-full opacity-85 blur-[.2px]"
          style={{ background: "conic-gradient(from 20deg,#edb63a,#329bc5,#7861b6,#df5f51,#72b46d,#edb63a)" }}
        />
        <div className="absolute inset-[4px] rounded-full border border-emerald-50/45 shadow-[inset_4px_5px_7px_rgba(255,255,255,.22),inset_-4px_-5px_8px_rgba(3,20,30,.35)]" />
      </>}
    </div>
  </SceneFrame>;
}

export function MarbleAvatarPreview({ avatar, ballStyle }: { avatar: MarbleAvatar; ballStyle: BallStyle }) {
  const entry = marbleAvatarEntry(avatar);
  return entry ? <AnimalSpritePreview entry={entry} /> : <BallStylePreview style={ballStyle} />;
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
  if (style === "instrument-pad") {
    return platformPreviewBase(<>
      <div className="absolute left-[36px] top-[38px] h-5 w-2 rounded-sm bg-slate-800 shadow-[5px_8px_12px_rgba(15,23,42,.28)]" />
      <div className="absolute left-[23px] top-[12px] h-9 w-9 rotate-[-7deg] rounded-md border border-white/25 bg-[linear-gradient(145deg,#55565a,#303136_70%)] shadow-[8px_11px_14px_rgba(15,23,42,.28)]" />
      <div className="absolute left-[28px] top-[17px] h-1 w-6 rotate-[-7deg] rounded-full bg-white/20" />
    </>, "bg-[linear-gradient(180deg,#d7dee5,#bfc8d1)]");
  }
  if (style === "metallophone-plate") {
    return platformPreviewBase(<>
      <div data-metallophone-mount="true" className="absolute left-[26px] top-[32px] h-7 w-9 rounded-bl-md border-b-[3px] border-l-[3px] border-slate-900" />
      <div className="absolute left-[18px] top-[17px] h-7 w-14 rounded-[4px] border border-slate-300 bg-[linear-gradient(180deg,#ffffff,#eeece8_58%,#9aa0aa)] shadow-[0_9px_13px_rgba(0,0,0,.34)]" />
      <span data-metallophone-bolt="true" className="absolute left-[29px] top-[29px] h-1.5 w-1.5 rounded-full bg-slate-800" />
      <span data-metallophone-bolt="true" className="absolute right-[29px] top-[29px] h-1.5 w-1.5 rounded-full bg-slate-800" />
      <div className="absolute left-[23px] top-[19px] h-1.5 w-10 rounded-full bg-white/80" />
    </>, "bg-[radial-gradient(circle_at_50%_34%,rgba(255,255,255,.22),transparent_48%),linear-gradient(180deg,#202634,#10141e)]");
  }
  if (style === "instrument-key" || style === "xylophone-key") {
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
  if (preset === "brick-wall") return <SceneFrame className="bg-[#08090a]">
    {Array.from({ length: 4 }).map((_, row) => Array.from({ length: 4 }).map((__, column) => <div key={`${row}-${column}`} className="absolute h-[10px] w-[28px] border border-black/80 bg-gradient-to-b from-zinc-700/65 to-zinc-900" style={{ left: `${-8 + column * 29 + (row % 2 ? 14 : 0)}px`, top: `${4 + row * 12}px` }} />))}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_42%,rgba(239,68,68,.38),transparent_48%)]" />
  </SceneFrame>;
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
  if (presetId.startsWith("reference-")) return <ReferencePresetThumbnail presetId={presetId as ReferenceVideoPresetId} />;
  if (presetId === "toy-pegboard") return <SceneFrame className="h-16 bg-[linear-gradient(180deg,#d6c8b9,#b6a18d)]">
    <div className="absolute inset-2 rounded-xl bg-[linear-gradient(180deg,#e8dfd4,#cbb9a7)] shadow-[inset_0_0_0_1px_rgba(255,255,255,.45)]" />
    {["#ef4444", "#facc15", "#22c55e", "#38bdf8", "#a855f7"].map((color, index) => <div key={color} className="absolute h-8 w-3 rounded-full border border-white/35 shadow-[0_5px_7px_rgba(70,45,30,.2)]" style={{ left: `${13 + index * 15}px`, top: `${18 + (index % 2) * 8}px`, background: color }} />)}
    <div className="absolute right-3 top-3 h-6 w-6 rounded-full border border-white/35 bg-[radial-gradient(circle,#ffd84d_0_16%,#fff_17%_26%,#ef4738_27%_50%,#9f1f24_80%)] shadow-[0_6px_10px_rgba(90,35,25,.28)]" />
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
  if (presetId === "vibraphone-wall") return <SceneFrame className="h-16 bg-[linear-gradient(180deg,#d9d5d0,#c3beb8)]">
    {[0,1,2,3].map((index) => <div key={index} className="absolute h-3 w-11 rounded-sm border border-white/30 bg-gradient-to-b from-slate-200 to-slate-500 shadow-[0_5px_8px_rgba(0,0,0,.18)]" style={{ left: `${12 + index * 12}px`, top: `${10 + index * 11}px`, transform: `rotate(${index % 2 ? -8 : 8}deg)` }} />)}
    <div className="absolute right-3 bottom-2 h-4 w-4 rounded-full bg-green-500" />
  </SceneFrame>;
  return <SceneFrame className="h-16 bg-[linear-gradient(180deg,#f2ede6,#d0d7e4)]">
    <div className="absolute inset-x-0 bottom-0 h-7 bg-[linear-gradient(180deg,#d3a673,#936846)]" style={{ clipPath: "polygon(0 100%,100% 100%,76% 0,24% 0)" }} />
    {[0, 1, 2].map((index) => <div key={index} className="absolute top-[26px] h-4 w-10 rounded-md border border-white/35 shadow-[0_8px_10px_rgba(15,23,42,.16)]" style={{ left: `${12 + index * 20}px`, background: ["linear-gradient(180deg,#fef08a,#f59e0b)", "linear-gradient(180deg,#a7f3d0,#14b8a6)", "linear-gradient(180deg,#bfdbfe,#3b82f6)"][index] }} />)}
    <div className="absolute right-4 top-4 h-5 w-5 rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff,rgba(255,255,255,.65)_16%,rgba(125,211,252,.45)_42%,rgba(8,47,73,.85))]" />
  </SceneFrame>;
}

function ReferencePresetThumbnail({ presetId }: { presetId: ReferenceVideoPresetId }) {
  if (presetId === "reference-korobeiniki-tubes") return <SceneFrame className="h-16 bg-[linear-gradient(180deg,#9a98a4,#777582)]">
    {["#93e9d5", "#f4a4d5", "#b6a2f4", "#f2d59d", "#92cbed"].map((color, index) => <div key={color} className="absolute h-4 w-9 origin-right shadow-[4px_6px_6px_rgba(0,0,0,.28)]" style={{ left: `${4 + index * 15}px`, top: `${3 + index * 10}px`, transform: `rotate(${index % 2 ? 12 : -10}deg)`, background: `linear-gradient(180deg,${color},color-mix(in_srgb,${color},#222 34%))`, clipPath: "polygon(0 30%,100% 0,100% 100%,0 70%)" }}><span className="absolute -right-2 top-0 h-4 w-4 rounded-full border-2 border-black/55" style={{ background: `radial-gradient(circle,#17171a 0 46%,${color} 49% 70%,#111 74%)` }} /></div>)}
    {[0, 1, 2].map((index) => <div key={index} className="absolute h-4 w-8 origin-right bg-gradient-to-b from-[#303136] to-[#111216] shadow-[4px_6px_6px_rgba(0,0,0,.32)]" style={{ left: `${9 + index * 22}px`, bottom: `${1 + index * 6}px`, transform: `rotate(${index % 2 ? -11 : 9}deg)`, clipPath: "polygon(0 30%,100% 0,100% 100%,0 70%)" }}><span className="absolute -right-2 top-0 h-4 w-4 rounded-full border-2 border-[#18191d] bg-[radial-gradient(circle,#050506_0_52%,#28292d_56%)]" /></div>)}
    <div className="absolute right-3 top-6 h-5 w-5 rounded-full border border-pink-100/70 bg-[repeating-linear-gradient(155deg,#5f177e_0_5px,#f59ad0_6px_9px)] shadow-[0_5px_9px_rgba(50,15,70,.35)]" />
  </SceneFrame>;
  if (presetId === "reference-wooden-marimba") return <SceneFrame className="h-16 bg-[#d9e4e5]">
    {[0, 1, 2, 3].map((index) => <div key={index} className="absolute h-3 w-12 rounded-sm border border-amber-950/30 bg-gradient-to-b from-amber-700 to-amber-950 shadow-[5px_7px_7px_rgba(0,0,0,.25)]" style={{ left: `${7 + index * 17}px`, top: `${7 + index * 13}px`, transform: `rotate(${index % 2 ? 12 : -8}deg)` }} />)}
  </SceneFrame>;
  if (presetId === "reference-cyan-piano") return <SceneFrame className="h-16 bg-[radial-gradient(circle_at_50%_42%,#0d6478_0%,#062b44_42%,#020813_100%)]">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(34,211,238,.2),transparent_55%)]" />
    {[0, 1, 2, 3].map((index) => <div key={index} className="absolute h-4 w-14 rounded-sm border border-cyan-100/70 bg-slate-100 shadow-[0_0_12px_rgba(34,211,238,.48),6px_8px_8px_rgba(0,0,0,.5)]" style={{ left: `${4 + index * 19}px`, top: `${6 + index * 13}px`, transform: `rotate(${index % 2 ? -12 : 9}deg)` }} />)}
  </SceneFrame>;
  if (presetId === "reference-era-corridor") return <SceneFrame className="h-16 bg-[linear-gradient(180deg,#e6ebef,#c7d0d8)]">
    {[0, 1, 2].map((row) => <div key={`left-${row}`} className="absolute h-4 w-4 rotate-[-14deg] rounded-sm border border-slate-400 bg-slate-700 shadow-[4px_5px_6px_rgba(15,23,42,.28)]" style={{ left: `${12 + row * 4}px`, top: `${7 + row * 17}px` }} />)}
    {[0, 1, 2].map((row) => <div key={`right-${row}`} className="absolute h-4 w-4 rotate-[14deg] rounded-sm border border-slate-400 bg-slate-700 shadow-[4px_5px_6px_rgba(15,23,42,.28)]" style={{ right: `${12 + row * 4}px`, top: `${7 + row * 17}px` }} />)}
    <div className="absolute left-1/2 top-[24px] h-5 w-5 -translate-x-1/2 rounded-full border border-white bg-[radial-gradient(circle_at_32%_28%,#fff,#a7f3d0_35%,#22c55e_100%)] shadow-[0_5px_8px_rgba(15,23,42,.24)]" />
  </SceneFrame>;
  if (presetId === "reference-faceted-metallophone") return <SceneFrame className="h-16 bg-[radial-gradient(circle_at_50%_34%,#5d6370,#171b29_72%)]">
    {[0, 1, 2].map((index) => <div key={index} className="absolute h-3 w-11 rounded-sm border border-slate-300 bg-slate-100 shadow-[5px_7px_7px_rgba(0,0,0,.42)]" style={{ left: `${8 + index * 22}px`, top: `${8 + index * 17}px`, transform: `rotate(${index % 2 ? 13 : -9}deg)` }}><span className="absolute left-2 top-1 h-1 w-1 rounded-full bg-slate-800" /><span className="absolute right-2 top-1 h-1 w-1 rounded-full bg-slate-800" /></div>)}
    <div className="absolute right-3 top-3 h-6 w-6 rounded-full border border-white/60 bg-[conic-gradient(#22c8e8,#2c70ed,#ff3cad,#ef3340,#ffb11b,#21c56b,#22c8e8)] shadow-[0_0_14px_rgba(255,255,255,.35)]" />
  </SceneFrame>;
  return <SceneFrame className="h-16 bg-[radial-gradient(circle_at_55%_40%,#31159b,#090022_65%)]">
    {[0, 1, 2].map((row) => <div key={row} className="absolute flex h-3 w-16 -rotate-12 overflow-hidden rounded-full shadow-[0_0_12px_rgba(32,233,255,.7)]" style={{ left: `${10 + row * 13}px`, top: `${9 + row * 17}px` }}>{Array.from({ length: 8 }, (_, index) => <span key={index} className={`h-full flex-1 ${index % 2 ? "bg-blue-700" : "bg-cyan-300"}`} />)}</div>)}
  </SceneFrame>;
}
