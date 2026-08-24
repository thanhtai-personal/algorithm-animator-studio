import { observer } from "mobx-react-lite";
import { Check, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSystemLang } from "@/hooks/use-system-lang";
import type { RhythmicStudioController } from "../hooks/useRhythmicStudioController";
import { RHYTHMIC_PRESET_IDS } from "../lib/studioPresets";
import { presetText } from "../presetI18n";
import { PresetThumbnail } from "./atoms/RhythmicOptionPreviews";

interface QuickPresetBarProps {
  studio: RhythmicStudioController;
  embedded?: boolean;
}

export const QuickPresetBar = observer(function QuickPresetBar({ studio, embedded = false }: QuickPresetBarProps) {
  const lang = useSystemLang();
  return <section className={embedded ? "min-w-0" : "rounded-2xl border bg-card/60 p-3 shadow-sm backdrop-blur"}>
    {!embedded && <div className="mb-2 px-0.5">
      <p className="text-sm font-semibold">{presetText(lang, "title")}</p>
      <p className="text-xs leading-relaxed text-muted-foreground">{presetText(lang, "hint")}</p>
    </div>}
    <div className={embedded ? "" : "max-h-[340px] overflow-y-auto pr-1"}>
      <div className={embedded ? "grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1" : "grid grid-cols-2 gap-2"}>
        {RHYTHMIC_PRESET_IDS.map((id) => {
          const active = studio.currentPresetId === id;
          return <Button
            key={id}
            type="button"
            variant={active ? "default" : "outline"}
            title={`${presetText(lang, id)} — ${presetText(lang, `${id}.hint`)}`}
            className="rhythmic-preset relative h-auto min-w-0 flex-col items-stretch gap-2 overflow-hidden px-2 py-2 text-left"
            onClick={() => studio.applyQuickPreset(id)}
            aria-pressed={active}
          >
            <span className="w-full overflow-hidden rounded-lg border border-border/60 bg-background/20"><PresetThumbnail presetId={id} /></span>
            <span className="min-w-0 truncate text-center text-[11px] font-semibold leading-tight">{presetText(lang, id)}</span>
            {active && <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-background text-foreground shadow"><Check className="h-3 w-3" /></span>}
          </Button>;
        })}
      </div>
    </div>
    <Button
      type="button"
      variant={studio.presetMixEnabled ? "secondary" : "outline"}
      className="mt-2 h-auto w-full justify-start gap-3 px-3 py-2.5 text-left"
      onClick={studio.togglePresetMix}
      aria-pressed={studio.presetMixEnabled}
    >
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${studio.presetMixEnabled ? "bg-primary text-primary-foreground" : "bg-muted"}`}><Shuffle className="h-4 w-4" /></span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-sm font-semibold">{presetText(lang, "mix")}<span className="text-[10px] font-medium text-muted-foreground">{studio.presetMixEnabled && studio.presetMixPlanActive ? `${presetText(lang, "mix.on")} · ${studio.presetMixSegmentCount}` : presetText(lang, studio.presetMixEnabled ? "mix.wait" : "mix.off")}</span></span>
        <span className="mt-0.5 block whitespace-normal text-xs font-normal leading-relaxed text-muted-foreground">{presetText(lang, "mix.hint")}</span>
      </span>
    </Button>
  </section>;
});
