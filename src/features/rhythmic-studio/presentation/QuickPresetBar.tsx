import { observer } from "mobx-react-lite";
import { CircleDot, Music2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSystemLang } from "@/hooks/use-system-lang";
import type { RhythmicStudioController } from "../hooks/useRhythmicStudioController";
import { RHYTHMIC_PRESET_IDS, type RhythmicPresetId } from "../lib/studioPresets";
import { presetText } from "../presetI18n";

const ICONS: Record<RhythmicPresetId, typeof CircleDot> = {
  "toy-pegboard": CircleDot,
  "neon-comet": Sparkles,
  "rainbow-xylophone": Music2,
};

export const QuickPresetBar = observer(function QuickPresetBar({ studio }: { studio: RhythmicStudioController }) {
  const lang = useSystemLang();
  return <section className="rounded-2xl border bg-card/60 p-3 shadow-sm backdrop-blur">
    <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
      <div><p className="text-sm font-semibold">{presetText(lang, "title")}</p><p className="text-xs text-muted-foreground">{presetText(lang, "hint")}</p></div>
    </div>
    <div className="grid gap-2 md:grid-cols-3">
      {RHYTHMIC_PRESET_IDS.map((id) => {
        const Icon = ICONS[id];
        const active = studio.activePresetId === id;
        return <Button key={id} type="button" variant={active ? "default" : "outline"} className="h-auto justify-start gap-3 px-3 py-3" onClick={() => studio.applyQuickPreset(id)}>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-background/20"><Icon className="h-4 w-4" /></span>
          <span className="text-left"><span className="block text-sm font-semibold">{presetText(lang, id)}</span><span className="block text-[11px] opacity-70">{presetText(lang, `${id}.hint`)}</span></span>
        </Button>;
      })}
    </div>
  </section>;
});
