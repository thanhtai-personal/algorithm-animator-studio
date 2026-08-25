import { observer } from "mobx-react-lite";
import { Check, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSystemLang } from "@/hooks/use-system-lang";
import type { RhythmicStudioController } from "../hooks/useRhythmicStudioController";
import { RHYTHMIC_PRESET_IDS } from "../lib/studioPresets";
import { presetText } from "../presetI18n";
import { PresetThumbnail } from "./atoms/RhythmicOptionPreviews";

interface QuickPresetBarProps {
  studio: RhythmicStudioController;
  embedded?: boolean;
  showMix?: boolean;
}

export const PresetMixButton = observer(function PresetMixButton({ studio, compact = false }: {
  studio: RhythmicStudioController;
  compact?: boolean;
}) {
  const lang = useSystemLang();
  const mixLabel = presetText(lang, "mix");
  const mixStatus = studio.presetMixEnabled && studio.presetMixPlanActive
    ? `${presetText(lang, "mix.on")} · ${studio.presetMixSegmentCount}`
    : presetText(lang, studio.presetMixEnabled ? "mix.wait" : "mix.off");

  return <Tooltip>
    <TooltipTrigger asChild>
      <Button
        type="button"
        variant={studio.presetMixEnabled ? "secondary" : "outline"}
        className={compact
          ? "h-8 shrink-0 gap-1.5 border-amber-300/30 bg-amber-300/[0.07] px-2.5 text-xs text-amber-100 hover:border-amber-200/60 hover:bg-amber-300/15"
          : "mt-2 h-10 w-full justify-start gap-2 px-3 text-left"}
        onClick={studio.togglePresetMix}
        aria-label={`${mixLabel}: ${mixStatus}`}
        aria-pressed={studio.presetMixEnabled}
      >
        <span className={`grid shrink-0 place-items-center ${compact ? "h-6 w-6 rounded-md" : "h-7 w-7 rounded-lg"} ${studio.presetMixEnabled ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
          <Shuffle className="h-3.5 w-3.5" />
        </span>
        <span className="font-semibold">{mixLabel}</span>
      </Button>
    </TooltipTrigger>
    <TooltipContent side={compact ? "bottom" : "right"} align="start" className="max-w-72 p-3">
      <p className="font-semibold">{mixLabel}</p>
      <p className="mt-0.5 text-xs font-medium text-primary">{mixStatus}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{presetText(lang, "mix.hint")}</p>
    </TooltipContent>
  </Tooltip>;
});

export const QuickPresetBar = observer(function QuickPresetBar({ studio, embedded = false, showMix = true }: QuickPresetBarProps) {
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
    {showMix && <PresetMixButton studio={studio} />}
  </section>;
});
