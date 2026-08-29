import { FileMusic, SlidersHorizontal, Sparkles } from "lucide-react";
import { useSystemLang } from "@/hooks/use-system-lang";
import type { RhythmicStudioController } from "../../hooks/useRhythmicStudioController";
import { rhythmicText } from "../../i18n";
import { layoutText } from "../../layoutI18n";
import { PresetMixButton, QuickPresetBar } from "../QuickPresetBar";
import { UploadCard } from "../atoms/UploadCard";
import { BallStyleFrame } from "../sections/BallStyleFrame";
import { BackgroundStyleFrame } from "../sections/BackgroundStyleFrame";
import { RhythmicAdvancedControlsDrawer } from "./RhythmicAdvancedControlsDrawer";
import { InstrumentMixDrawer } from "../InstrumentMixDrawer";

export function RhythmicPresetControls({ studio }: { studio: RhythmicStudioController }) {
  const lang = useSystemLang();
  return <aside className="rhythmic-side-panel rhythmic-preset-panel min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#101419]/95 shadow-2xl xl:sticky xl:top-[81px] xl:max-h-[calc(100dvh-97px)]">
    <header className="border-b border-white/10 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="flex min-w-0 items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
          <Sparkles className="h-3.5 w-3.5" />{layoutText(lang, "lab.sceneDeck")}
        </p>
        <PresetMixButton studio={studio} compact />
      </div>
    </header>
    <div className="max-h-[calc(100dvh-190px)] space-y-3 overflow-y-auto p-3 rhythmic-scrollbar">
      <QuickPresetBar studio={studio} embedded showMix={false} />
      <InstrumentMixDrawer studio={studio} />
    </div>
  </aside>;
}

export function RhythmicWorkflowControls({ studio }: { studio: RhythmicStudioController }) {
  const lang = useSystemLang();
  const t = (key: Parameters<typeof rhythmicText>[1]) => rhythmicText(lang, key);
  const midiTitle = studio.source.type === "midi" ? studio.source.name : t("song.uploadMidi");
  const midiHint = studio.source.type === "midi" ? studio.audioFileInfo : t("song.uploadMidiHint");
  return <aside className="rhythmic-side-panel rhythmic-workflow-panel flex min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#101419]/95 shadow-2xl xl:sticky xl:top-[81px] xl:max-h-[calc(100dvh-97px)]">
    <div className="shrink-0 border-b border-white/10 px-4 py-4">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
        <SlidersHorizontal className="h-3.5 w-3.5" />{layoutText(lang, "lab.inspector")}
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{layoutText(lang, "lab.inspectorHint")}</p>
      <RhythmicAdvancedControlsDrawer studio={studio} />
    </div>
    <div className="min-h-0 flex-1 overflow-y-auto rhythmic-scrollbar">
      <div className="space-y-3 p-3">
        <UploadCard icon={FileMusic} title={midiTitle} hint={midiHint} accept=".mid,.midi,audio/midi" onFile={studio.importMidi} />
        <BallStyleFrame studio={studio} />
        <BackgroundStyleFrame studio={studio} />
      </div>
    </div>
  </aside>;
}
