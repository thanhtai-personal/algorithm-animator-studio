import { Braces, Cpu, Layers3 } from "lucide-react";
import type { Frame } from "@/lib/algorithms";
import type { Lang } from "@/lib/i18n";
import type { Theme } from "@/lib/renderer";
import { AlgorithmScene3D } from "./AlgorithmScene3D";
import { eventLabel } from "./algorithm3dMath";
import type { AlgorithmVideoAdSelection } from "@/lib/algorithmVideoAds";

export function Algorithm3DPreview({ frame, previousFrame, frameIndex, transitionProgress, width, height, theme, title, subtitle, code, showCode, complexity, lang, ads }: {
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
}) {
  const portrait = height > width;
  return (
    <div
      className="relative mx-auto w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d1419] shadow-[0_20px_70px_rgba(0,0,0,0.55)]"
      style={{ maxHeight: "70vh", aspectRatio: `${width}/${height}` }}
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
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[18%] bg-gradient-to-b from-black/30 to-transparent" />
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/[0.05]" />

      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 p-4 sm:p-5">
        <div className="min-w-0 max-w-[62%] border-l-2 pl-3 sm:pl-4" style={{ borderColor: theme.highlight }}>
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.25em] text-white/58 sm:text-[10px]">
            <Layers3 className="h-3 w-3" style={{ color: theme.highlight }} /> Data construction · 3D
          </div>
          <h3 className="mt-1 truncate text-base font-black tracking-[-0.025em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)] sm:text-2xl">{title}</h3>
          {subtitle ? <p className="mt-0.5 truncate text-[10px] font-medium text-white/58 sm:text-xs">{subtitle}</p> : null}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusPill icon={<Cpu className="h-3 w-3" />} label={eventLabel(frame)} color={frame.event === "swap" ? theme.swap : theme.highlight} />
          {complexity ? <div className="flex gap-1.5"><MiniPill label={`T ${complexity.time}`} /><MiniPill label={`S ${complexity.space}`} /></div> : null}
        </div>
      </header>

      <StateChip frame={frame} frameIndex={frameIndex} lang={lang} showCode={showCode} />
      {showCode ? <ExecutionDock code={code} activeLine={frame.line} portrait={portrait} lang={lang} accent={theme.highlight} /> : null}
      <CornerMarks />
    </div>
  );
}

function StatusPill({ label, icon, color }: { label: string; icon?: React.ReactNode; color: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-md border border-white/[0.10] bg-black/55 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-white/88 sm:text-[10px]">
      <span style={{ color }}>{icon}</span>{label}
    </span>
  );
}

function MiniPill({ label }: { label: string }) {
  return <span className="rounded-md border border-white/[0.08] bg-black/48 px-2 py-1 font-mono text-[8px] font-bold text-white/58 sm:text-[9px]">{label}</span>;
}

function StateChip({ frame, frameIndex, lang, showCode }: { frame: Frame; frameIndex: number; lang: Lang; showCode: boolean }) {
  return (
    <div className={`pointer-events-none absolute left-4 ${showCode ? "bottom-[18%]" : "bottom-4"} max-w-[46%] sm:left-5`}>
      <div className="mb-1 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.18em] text-white/44">
        <Braces className="h-3 w-3 text-emerald-300" /> state · {String(frameIndex + 1).padStart(3, "0")}
      </div>
      <div className="truncate rounded-md border border-white/[0.07] bg-black/48 px-2.5 py-1.5 font-mono text-[8px] text-white/72 sm:text-[9px]">
        {formatVars(frame.vars, lang)}
      </div>
    </div>
  );
}

function ExecutionDock({ code, activeLine, portrait, lang, accent }: { code: string; activeLine: number; portrait: boolean; lang: Lang; accent: string }) {
  const lines = code.split("\n");
  const start = Math.max(0, Math.min(lines.length - 1, activeLine - 2));
  const visible = lines.slice(start, start + (portrait ? 2 : 3));
  return (
    <div className={`pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 overflow-hidden rounded-lg border border-white/[0.09] bg-[#071016]/[0.88] px-3 py-2 shadow-[0_8px_22px_rgba(0,0,0,0.28)] ${portrait ? "w-[88%]" : "w-[58%]"}`}>
      <div className="mb-1.5 flex items-center gap-2 text-[7px] font-black uppercase tracking-[0.20em] text-white/48 sm:text-[8px]">
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
        {lang === "vi" ? "Lệnh đang chạy" : "Executing"}
      </div>
      <pre className="overflow-hidden whitespace-pre font-mono text-[7px] leading-[1.42] text-white/42 sm:text-[8px]">
        {visible.map((line, offset) => {
          const lineNo = start + offset + 1;
          const active = lineNo === activeLine;
          return (
            <div key={lineNo} className={`relative truncate rounded px-1 py-[1px] ${active ? "bg-white/[0.07] text-white/92" : ""}`}>
              {active ? <span className="absolute inset-y-0 left-0 w-[2px]" style={{ backgroundColor: accent }} /> : null}
              <span className="mr-2 inline-block w-4 text-right text-white/22">{String(lineNo).padStart(2, "0")}</span>{line}
            </div>
          );
        })}
      </pre>
    </div>
  );
}

function CornerMarks() {
  return (
    <>
      <span className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l border-t border-white/18" />
      <span className="pointer-events-none absolute right-2 top-2 h-3 w-3 border-r border-t border-white/18" />
      <span className="pointer-events-none absolute bottom-2 left-2 h-3 w-3 border-b border-l border-white/18" />
      <span className="pointer-events-none absolute bottom-2 right-2 h-3 w-3 border-b border-r border-white/18" />
    </>
  );
}

function formatVars(vars: Record<string, number | string>, lang: Lang) {
  const entries = Object.entries(vars).slice(0, 5);
  if (!entries.length) return lang === "vi" ? "Đang khởi tạo…" : "Initializing…";
  return entries.map(([key, value]) => `${key}=${value}`).join("   ");
}
