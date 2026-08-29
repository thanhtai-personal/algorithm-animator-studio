import { Box, Cpu, Layers3 } from "lucide-react";
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
    <div className="relative mx-auto w-full overflow-hidden rounded-xl border border-white/10 bg-slate-950 shadow-[0_24px_80px_rgba(2,6,23,0.7)]" style={{ maxHeight: "70vh", aspectRatio: `${width}/${height}` }}>
      <AlgorithmScene3D frame={frame} previousFrame={previousFrame} frameIndex={frameIndex} width={width} height={height} theme={theme} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,transparent_20%,rgba(2,6,23,0.18)_72%,rgba(2,6,23,0.5)_100%)]" />
      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 sm:p-4">
        <div className="min-w-0 rounded-xl border border-white/10 bg-slate-950/58 px-3 py-2 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">
            <Layers3 className="h-3.5 w-3.5" /> WebGL 3D
          </div>
          <h3 className="mt-1 truncate text-sm font-black text-white sm:text-lg">{title}</h3>
          {subtitle ? <p className="mt-0.5 truncate text-[10px] text-slate-300 sm:text-xs">{subtitle}</p> : null}
        </div>
        <div className="flex flex-wrap justify-end gap-1.5 text-[9px] font-bold uppercase tracking-wider sm:text-[10px]">
          <Badge icon={<Cpu className="h-3 w-3" />} label={eventLabel(frame)} />
          {complexity ? <Badge label={`O ${complexity.time}`} /> : null}
          {complexity ? <Badge label={`MEM ${complexity.space}`} /> : null}
        </div>
      </header>

      {showCode ? <CodeGlassPanel code={code} activeLine={frame.line} portrait={portrait} lang={lang} /> : null}

      <div className="pointer-events-none absolute bottom-3 left-3 max-w-[76%] rounded-lg border border-white/10 bg-slate-950/62 px-3 py-2 text-[10px] text-slate-200 shadow-lg backdrop-blur-md sm:text-xs">
        <div className="mb-1 flex items-center gap-1.5 font-bold uppercase tracking-[0.16em] text-emerald-300"><Box className="h-3.5 w-3.5" /> Frame {frameIndex + 1}</div>
        <div className="line-clamp-2 font-mono text-slate-300">{formatVars(frame.vars, lang)}</div>
      </div>
    </div>
  );
}

function Badge({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return <span className="flex items-center gap-1 rounded-full border border-white/10 bg-slate-950/60 px-2 py-1 text-cyan-100 shadow backdrop-blur-md">{icon}{label}</span>;
}

function CodeGlassPanel({ code, activeLine, portrait, lang }: { code: string; activeLine: number; portrait: boolean; lang: Lang }) {
  const lines = code.split("\n");
  const start = Math.max(0, Math.min(lines.length - 1, activeLine - 3));
  const visible = lines.slice(start, start + (portrait ? 6 : 9));
  return (
    <div className={`pointer-events-none absolute border border-white/10 bg-slate-950/66 shadow-2xl backdrop-blur-md ${portrait ? "inset-x-3 bottom-20 max-h-[25%] rounded-xl p-2" : "bottom-3 right-3 top-[29%] w-[36%] rounded-xl p-3"}`}>
      <div className="mb-2 text-[9px] font-extrabold uppercase tracking-[0.2em] text-cyan-200">{lang === "vi" ? "Mã đang chạy" : "Live code"}</div>
      <pre className="overflow-hidden whitespace-pre-wrap break-words font-mono text-[9px] leading-relaxed text-slate-300 sm:text-[10px]">
        {visible.map((line, offset) => {
          const lineNo = start + offset + 1;
          const active = lineNo === activeLine;
          return <div key={lineNo} className={active ? "-mx-1 rounded bg-cyan-400/15 px-1 text-cyan-100" : ""}><span className="mr-2 text-slate-600">{String(lineNo).padStart(2, "0")}</span>{line}</div>;
        })}
      </pre>
    </div>
  );
}

function formatVars(vars: Record<string, number | string>, lang: Lang) {
  const entries = Object.entries(vars).slice(0, 6);
  if (!entries.length) return lang === "vi" ? "Đang khởi tạo trạng thái thuật toán..." : "Initializing algorithm state...";
  return entries.map(([key, value]) => `${key}=${value}`).join("   ");
}
