import { observer } from "mobx-react-lite";
import { Button } from "@/components/ui/button";
import { useSystemLang } from "@/hooks/use-system-lang";
import type { RhythmicStudioController } from "../hooks/useRhythmicStudioController";
import { RHYTHMIC_PRESET_IDS } from "../lib/studioPresets";
import { presetText } from "../presetI18n";
import { PresetThumbnail } from "./atoms/RhythmicOptionPreviews";

export const QuickPresetBar = observer(function QuickPresetBar({ studio }: { studio: RhythmicStudioController }) {
  const lang = useSystemLang();
  return <section className="rounded-2xl border bg-card/60 p-3 shadow-sm backdrop-blur">
    <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
      <div><p className="text-sm font-semibold">{presetText(lang, "title")}</p><p className="text-xs text-muted-foreground">{presetText(lang, "hint")}</p></div>
    </div>
    <div className="grid gap-2 md:grid-cols-3">
      {RHYTHMIC_PRESET_IDS.map((id) => {
        const active = studio.activePresetId === id;
        return <Button key={id} type="button" variant={active ? "default" : "outline"} className="h-auto justify-start gap-3 px-3 py-3" onClick={() => studio.applyQuickPreset(id)}>
          <span className="w-[120px] shrink-0 overflow-hidden rounded-xl border border-border/60 bg-background/20"><PresetThumbnail presetId={id} /></span>
          <span className="text-left"><span className="block text-sm font-semibold">{presetText(lang, id)}</span><span className="block text-[11px] opacity-70">{presetText(lang, `${id}.hint`)}</span></span>
        </Button>;
      })}
    </div>
  </section>;
});
