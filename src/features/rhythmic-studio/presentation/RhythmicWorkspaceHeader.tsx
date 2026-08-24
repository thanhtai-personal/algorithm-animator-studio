import { FolderOpen, Info, Radio, Save, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSystemLang } from "@/hooks/use-system-lang";
import { rhythmicText } from "../i18n";
import { layoutText } from "../layoutI18n";

interface Props {
  status: string;
  sourceName: string;
  playing: boolean;
  onInfo: () => void;
  onProjects: () => void;
  onRandomize: () => void;
  onSave: () => void;
}

export function RhythmicWorkspaceHeader(props: Props) {
  const lang = useSystemLang();
  const t = (key: Parameters<typeof rhythmicText>[1]) => rhythmicText(lang, key);
  const lt = (key: Parameters<typeof layoutText>[1]) => layoutText(lang, key);
  const steps = ["lab.stepSource", "lab.stepScene", "lab.stepPerform", "lab.stepExport"] as const;

  return (
    <header className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#0a1119]/92 px-4 py-4 text-slate-100 shadow-[0_24px_80px_rgba(0,0,0,.34)] md:px-5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/90 to-transparent" />
      <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-amber-300/35 bg-amber-300/10 text-amber-300">
            <Radio className="h-5 w-5" />
            <span className={`absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#0a1119] ${props.playing ? "animate-pulse bg-emerald-400" : "bg-slate-500"}`} />
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-amber-300/90">{lt("lab.eyebrow")}</p>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="font-['Bahnschrift'] text-xl font-black uppercase tracking-[0.04em] md:text-2xl">{t("page.title")}</h1>
              <span className="truncate font-mono text-[11px] text-cyan-200/70">{props.sourceName}</span>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">{props.status} · {t("page.subtitle")}</p>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-center gap-1 overflow-x-auto rounded-xl border border-white/10 bg-black/20 p-1" aria-label={lt("lab.workflow")}>
            {steps.map((key, index) => (
              <div key={key} className="flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-300">
                <span className="font-mono text-amber-300/75">0{index + 1}</span>{lt(key)}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" className="text-slate-300 hover:bg-white/10 hover:text-white" onClick={props.onInfo}><Info className="mr-1.5 h-4 w-4" />{lt("page.info")}</Button>
            <Button size="sm" variant="ghost" className="text-slate-300 hover:bg-white/10 hover:text-white" onClick={props.onProjects}><FolderOpen className="mr-1.5 h-4 w-4" />{t("page.projects")}</Button>
            <Button size="sm" variant="outline" className="border-white/15 bg-white/5 text-slate-100 hover:bg-white/10" onClick={props.onRandomize}><Shuffle className="mr-1.5 h-4 w-4" />{t("page.randomize")}</Button>
            <Button size="sm" className="bg-amber-300 text-slate-950 hover:bg-amber-200" onClick={props.onSave}><Save className="mr-1.5 h-4 w-4" />{t("page.savePreset")}</Button>
          </div>
        </div>
      </div>
    </header>
  );
}
