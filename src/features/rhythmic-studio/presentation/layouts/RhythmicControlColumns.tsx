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

    <div className="space-y-3">
      <SourceFrame studio={studio} />
      <TerrainFrame studio={studio} />
      <MotionFrame studio={studio} />
      <VisualFrame studio={studio} />
    </div>
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
