import { Mountain, Move3d, Music2, Sparkles } from "lucide-react";
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
import { TerrainFrame } from "../sections/TerrainFrame";
import { VisualFrame } from "../sections/VisualFrame";

export function RhythmicPrimaryControls({ studio }: { studio: RhythmicStudioController }) {
  const lang = useSystemLang();
  return <aside className="min-w-0 space-y-3 xl:sticky xl:top-[81px] xl:max-h-[calc(100dvh-97px)] xl:overflow-y-auto xl:pr-1">
    <div className="px-1">
      <p className="text-sm font-semibold">{layoutText(lang, "panel.primaryTitle")}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{layoutText(lang, "panel.primaryHint")}</p>
    </div>

    <QuickPresetBar studio={studio} />

    <Tabs defaultValue="source" className="min-w-0">
      <TabsList className="grid h-auto w-full grid-cols-4 gap-1 p-1">
        <TabsTrigger value="source" className="min-w-0 gap-1 px-2 py-2.5 text-[11px]"><Music2 className="h-4 w-4 shrink-0" />{layoutText(lang, "tabs.source")}</TabsTrigger>
        <TabsTrigger value="terrain" className="min-w-0 gap-1 px-2 py-2.5 text-[11px]"><Mountain className="h-4 w-4 shrink-0" />{layoutText(lang, "tabs.terrain")}</TabsTrigger>
        <TabsTrigger value="motion" className="min-w-0 gap-1 px-2 py-2.5 text-[11px]"><Move3d className="h-4 w-4 shrink-0" />{layoutText(lang, "tabs.motion")}</TabsTrigger>
        <TabsTrigger value="visual" className="min-w-0 gap-1 px-2 py-2.5 text-[11px]"><Sparkles className="h-4 w-4 shrink-0" />{layoutText(lang, "tabs.visual")}</TabsTrigger>
      </TabsList>
      <TabsContent value="source" className="mt-3"><SourceFrame studio={studio} /></TabsContent>
      <TabsContent value="terrain" className="mt-3"><TerrainFrame studio={studio} /></TabsContent>
      <TabsContent value="motion" className="mt-3"><MotionFrame studio={studio} /></TabsContent>
      <TabsContent value="visual" className="mt-3"><VisualFrame studio={studio} /></TabsContent>
    </Tabs>
  </aside>;
}

export function RhythmicAdvancedControls({ studio }: { studio: RhythmicStudioController }) {
  const lang = useSystemLang();
  return <section className="space-y-3 rounded-2xl border border-dashed border-border/80 bg-muted/15 p-3">
    <div className="px-1">
      <p className="text-sm font-semibold">{layoutText(lang, "panel.advancedTitle")}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{layoutText(lang, "panel.advancedHint")}</p>
    </div>
    <div className="grid items-start gap-3 lg:grid-cols-3">
      <LayoutFrame studio={studio} />
      <MediaFrame studio={studio} />
      <SoundFrame studio={studio} />
    </div>
  </section>;
}
