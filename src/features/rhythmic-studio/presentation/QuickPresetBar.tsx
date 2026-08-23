import { observer } from "mobx-react-lite";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSystemLang } from "@/hooks/use-system-lang";
import type { RhythmicStudioController } from "../hooks/useRhythmicStudioController";
import { RHYTHMIC_PRESET_IDS } from "../lib/studioPresets";
import { presetText } from "../presetI18n";
import { PresetThumbnail } from "./atoms/RhythmicOptionPreviews";

export const QuickPresetBar = observer(function QuickPresetBar({ studio }: { studio: RhythmicStudioController }) {
  const lang = useSystemLang();
  return <section className="rounded-2xl border bg-card/60 p-3 shadow-sm backdrop-blur">
    <div className="mb-2 px-0.5">
      <p className="text-sm font-semibold">{presetText(lang, "title")}</p>
      <p className="text-xs leading-relaxed text-muted-foreground">{presetText(lang, "hint")}</p>
    </div>
    <div className="grid grid-cols-3 gap-2">
      {RHYTHMIC_PRESET_IDS.map((id) => {
        const active = studio.activePresetId === id;
        return <Button
          key={id}
          type="button"
          variant={active ? "default" : "outline"}
          title={`${presetText(lang, id)} — ${presetText(lang, `${id}.hint`)}`}
          className="relative h-auto min-w-0 flex-col items-stretch gap-2 overflow-hidden px-2 py-2 text-left"
          onClick={() => studio.applyQuickPreset(id)}
        >
          <span className="w-full overflow-hidden rounded-lg border border-border/60 bg-background/20"><PresetThumbnail presetId={id} /></span>
          <span className="min-w-0 text-center text-[11px] font-semibold leading-tight">{presetText(lang, id)}</span>
          {active && <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-background text-foreground shadow"><Check className="h-3 w-3" /></span>}
        </Button>;
      })}
    </div>
  </section>;
});
