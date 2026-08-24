import { SlidersHorizontal, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSystemLang } from "@/hooks/use-system-lang";
import type { RhythmicStudioController } from "../../hooks/useRhythmicStudioController";
import { layoutText } from "../../layoutI18n";
import { QuickPresetBar } from "../QuickPresetBar";
import { LayoutFrame } from "../sections/LayoutFrame";
import { MediaFrame } from "../sections/MediaFrame";
import { MotionFrame } from "../sections/MotionFrame";
import { SoundFrame } from "../sections/SoundFrame";
import { SourceFrame } from "../sections/SourceFrame";
import { ShowcaseFrame } from "../sections/ShowcaseFrame";
import { TerrainFrame } from "../sections/TerrainFrame";
import { VisualFrame } from "../sections/VisualFrame";

export function RhythmicPresetControls({ studio }: { studio: RhythmicStudioController }) {
  const lang = useSystemLang();
  return <aside className="rhythmic-side-panel min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#101419]/95 shadow-2xl xl:sticky xl:top-[81px] xl:max-h-[calc(100dvh-97px)]">
    <div className="border-b border-white/10 px-4 py-4">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
        <Sparkles className="h-3.5 w-3.5" />{layoutText(lang, "lab.sceneDeck")}
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{layoutText(lang, "lab.sceneDeckHint")}</p>
    </div>
    <div className="max-h-[calc(100dvh-190px)] overflow-y-auto p-3 rhythmic-scrollbar">
      <QuickPresetBar studio={studio} embedded />
    </div>
  </aside>;
}

const tabClass = "h-8 min-w-0 px-2 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400 data-[state=active]:bg-amber-300 data-[state=active]:text-slate-950";

export function RhythmicWorkflowControls({ studio }: { studio: RhythmicStudioController }) {
  const lang = useSystemLang();
  return <aside className="rhythmic-side-panel min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#101419]/95 shadow-2xl xl:sticky xl:top-[81px] xl:max-h-[calc(100dvh-97px)]">
    <div className="border-b border-white/10 px-4 py-4">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
        <SlidersHorizontal className="h-3.5 w-3.5" />{layoutText(lang, "lab.inspector")}
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{layoutText(lang, "lab.inspectorHint")}</p>
    </div>
    <Tabs defaultValue="source" className="min-w-0">
      <div className="border-b border-white/10 p-2">
        <TabsList className="grid h-9 w-full grid-cols-4 bg-black/30 p-0.5">
          <TabsTrigger className={tabClass} value="source">{layoutText(lang, "lab.tabSource")}</TabsTrigger>
          <TabsTrigger className={tabClass} value="build">{layoutText(lang, "lab.tabBuild")}</TabsTrigger>
          <TabsTrigger className={tabClass} value="look">{layoutText(lang, "lab.tabLook")}</TabsTrigger>
          <TabsTrigger className={tabClass} value="finish">{layoutText(lang, "lab.tabFinish")}</TabsTrigger>
        </TabsList>
      </div>
      <div className="max-h-[calc(100dvh-231px)] overflow-y-auto p-3 rhythmic-scrollbar">
        <TabsContent value="source" className="m-0"><SourceFrame studio={studio} /></TabsContent>
        <TabsContent value="build" className="m-0 space-y-3">
          <ShowcaseFrame studio={studio} />
          <TerrainFrame studio={studio} />
          <LayoutFrame studio={studio} />
        </TabsContent>
        <TabsContent value="look" className="m-0 space-y-3">
          <MotionFrame studio={studio} />
          <VisualFrame studio={studio} />
        </TabsContent>
        <TabsContent value="finish" className="m-0 space-y-3">
          <SoundFrame studio={studio} />
          <MediaFrame studio={studio} />
        </TabsContent>
      </div>
    </Tabs>
  </aside>;
}
