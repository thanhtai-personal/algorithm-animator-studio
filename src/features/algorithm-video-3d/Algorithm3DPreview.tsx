import { Braces, Cpu, Layers3 } from "lucide-react";
import type { Frame } from "@/lib/algorithms";
import type { Lang } from "@/lib/i18n";
import type { Theme } from "@/lib/renderer";
import { AlgorithmScene3D } from "./AlgorithmScene3D";
import { eventLabel } from "./algorithm3dMath";

export function Algorithm3DPreview({ frame, previousFrame, frameIndex, width, height, theme, title, subtitle, code, showCode, complexity, lang }: {
  frame: Frame;
  previousFrame?: Frame | null;
  frameIndex: number;
  width: number;
  height: number;
  theme: Theme;
  title: string;
  subtitle: string;
  code: string;
  showCode: boolean;
  complexity?: { time: string; best?: string; worst?: string; space: string };
  lang: Lang;
}) {
  const portrait = height > width;
  return (
    <div
      className="relative mx-auto w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#03060d] shadow-[0_28px_90px_rgba(0,0,0,0.72)]"
      style={{ maxHeight: "70vh", aspectRatio: `${width}/${height}` }}
    >
      <AlgorithmScene3D frame={frame} previousFrame={previousFrame} frameIndex={frameIndex} width={width} height={height} theme={theme} />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.30)_0%,transparent_24%,transparent_70%,rgba(2,6,23,0.42)_100%)]" />
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/[0.06]" />

      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 p-4 sm:p-5">
        <div className="min-w-0 max-w-[68%] border-l-2 pl-3 sm:pl-4" style={{ borderColor: theme.highlight }}>
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.28em] text-white/55 sm:text-[10px]">
            <Layers3 className="h-3 w-3" style={{ color: theme.highlight }} /> Algorithm visualization · 3D
          </div>
          <h3 className="mt-1.5 truncate text-base font-black tracking-[-0.025em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.75)] sm:text-2xl">{title}</h3>
          {subtitle ? <p className="mt-0.5 truncate text-[10px] font-medium text-white/52 sm:text-xs">{subtitle}</p> : null}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusPill icon={<Cpu className="h-3 w-3" />} label={eventLabel(frame)} color={theme.highlight} />
          {complexity ? <div className="flex gap-1.5"><MiniPill label={`T ${complexity.time}`} /><MiniPill label={`S ${complexity.space}`} /></div> : null}
        </div>
      </header>

      {showCode ? <CodePanel code={code} activeLine={frame.line} portrait={portrait} lang={lang} accent={theme.highlight} /> : null}

      <div className={`pointer-events-none absolute bottom-4 left-4 ${showCode && !portrait ? "max-w-[48%]" : "max-w-[78%]"} sm:bottom-5 sm:left-5`}>
        <div className="mb-1.5 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.22em] text-white/45">
          <Braces className="h-3 w-3" style={{ color: theme.sorted }} /> state · {String(frameIndex + 1).padStart(3, "0")}
        </div>
        <div className="rounded-lg border border-white/[0.07] bg-black/35 px-3 py-2 font-mono text-[9px] text-white/70 shadow-lg backdrop-blur-md sm:text-[10px]">
          {formatVars(frame.vars, lang)}
        </div>
      </div>

      <CornerMarks />
    </div>
  );
}

function StatusPill({ label, icon, color }: { label: string; icon?: React.ReactNode; color: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-md border border-white/[0.09] bg-black/42 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-white/85 shadow-lg backdrop-blur-md sm:text-[10px]">
      <span style={{ color }}>{icon}</span>{label}
    </span>
  );
}

function MiniPill({ label }: { label: string }) {
  return <span className="rounded-md border border-white/[0.07] bg-black/32 px-2 py-1 font-mono text-[8px] font-bold text-white/52 backdrop-blur-md sm:text-[9px]">{label}</span>;
}

function CodePanel({ code, activeLine, portrait, lang, accent }: { code: string; activeLine: number; portrait: boolean; lang: Lang; accent: string }) {
  const lines = code.split("\n");
  const start = Math.max(0, Math.min(lines.length - 1, activeLine - 3));
  const visible = lines.slice(start, start + (portrait ? 6 : 10));
  return (
    <div className={`pointer-events-none absolute overflow-hidden border border-white/[0.08] bg-[#050914]/78 shadow-[0_16px_50px_rgba(0,0,0,0.38)] backdrop-blur-xl ${portrait ? "inset-x-4 bottom-[17%] max-h-[24%] rounded-xl p-2.5" : "bottom-5 right-5 top-[30%] w-[35%] rounded-xl p-3.5"}`}>
      <div className="mb-2.5 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.24em] text-white/48 sm:text-[9px]">
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent, boxShadow: `0 0 12px ${accent}` }} />
        {lang === "vi" ? "Mã đang thực thi" : "Execution trace"}
      </div>
      <pre className="overflow-hidden whitespace-pre-wrap break-words font-mono text-[8px] leading-[1.58] text-white/46 sm:text-[9px]">
        {visible.map((line, offset) => {
          const lineNo = start + offset + 1;
          const active = lineNo === activeLine;
          return (
            <div key={lineNo} className={`relative -mx-1.5 rounded px-1.5 py-[1px] ${active ? "bg-white/[0.055] text-white/90" : ""}`}>
              {active ? <span className="absolute inset-y-0 left-0 w-[2px] rounded-full" style={{ backgroundColor: accent }} /> : null}
              <span className="mr-2 inline-block w-4 text-right text-white/20">{String(lineNo).padStart(2, "0")}</span>{line}
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
      <span className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l border-t border-white/20" />
      <span className="pointer-events-none absolute right-2 top-2 h-3 w-3 border-r border-t border-white/20" />
      <span className="pointer-events-none absolute bottom-2 left-2 h-3 w-3 border-b border-l border-white/20" />
      <span className="pointer-events-none absolute bottom-2 right-2 h-3 w-3 border-b border-r border-white/20" />
    </>
  );
}

function formatVars(vars: Record<string, number | string>, lang: Lang) {
  const entries = Object.entries(vars).slice(0, 6);
  if (!entries.length) return lang === "vi" ? "Đang khởi tạo trạng thái thuật toán…" : "Initializing algorithm state…";
  return entries.map(([key, value]) => `${key}=${value}`).join("   ");
}
