import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { ArrowRight, Music2, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useSystemLang } from "@/hooks/use-system-lang";
import type { RhythmicStudioController } from "../hooks/useRhythmicStudioController";
import { instrumentMixText } from "../instrumentMixI18n";
import { PHRASE_INSTRUMENT_SEQUENCE, type PhraseInstrumentFamily } from "../lib/phraseInstrumentMix";
import { MIXED_INSTRUMENT_PRESET_ID } from "../lib/studioPresets";
import { showcaseText, type ShowcaseTextKey } from "../showcaseI18n";

function familyLabelKey(family: PhraseInstrumentFamily): ShowcaseTextKey {
  return `family.${family}`;
}

function InstrumentDurationInput({ durationSeconds, label, onCommit }: {
  durationSeconds: number;
  label: string;
  onCommit: (seconds: number) => void;
}) {
  const [value, setValue] = useState(durationSeconds.toFixed(1));
  useEffect(() => setValue(durationSeconds.toFixed(1)), [durationSeconds]);

  const commit = () => {
    const seconds = Number(value);
    if (Number.isFinite(seconds)) onCommit(seconds);
    else setValue(durationSeconds.toFixed(1));
  };

  return <Input
    type="number"
    min={0.5}
    step={0.1}
    value={value}
    aria-label={label}
    className="border-white/10 bg-[#0b0f14] text-slate-100"
    onChange={(event) => setValue(event.target.value)}
    onBlur={commit}
    onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
  />;
}

export const InstrumentMixDrawer = observer(function InstrumentMixDrawer({ studio }: {
  studio: RhythmicStudioController;
}) {
  const lang = useSystemLang();
  if (studio.activePresetId !== MIXED_INSTRUMENT_PRESET_ID) return null;

  return <Sheet>
    <SheetTrigger asChild>
      <Button
        type="button"
        variant="outline"
        className="h-auto w-full justify-between border-amber-300/30 bg-amber-300/[0.07] px-3 py-2.5 text-left text-amber-100 hover:border-amber-200/60 hover:bg-amber-300/15"
        aria-label={instrumentMixText(lang, "button")}
      >
        <span className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-300/10 text-amber-300">
            <Music2 className="h-4 w-4" />
          </span>
          <span className="font-semibold">{instrumentMixText(lang, "button")}</span>
        </span>
        <ArrowRight className="h-4 w-4 text-amber-300" />
      </Button>
    </SheetTrigger>

    <SheetContent side="right" className="w-[min(94vw,520px)] max-w-none overflow-hidden border-white/10 bg-[#101419] p-0 sm:max-w-[520px]">
      <div className="flex h-full min-h-0 flex-col">
        <SheetHeader className="shrink-0 border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(252,211,77,.12),transparent_58%)] px-5 py-5 pr-12">
          <SheetTitle className="flex items-center gap-2 text-base text-slate-100">
            <Music2 className="h-4 w-4 text-amber-300" />
            {instrumentMixText(lang, "title")}
          </SheetTitle>
          <SheetDescription className="text-xs leading-5 text-slate-400">
            {instrumentMixText(lang, "hint")}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 rhythmic-scrollbar">
          {studio.instrumentMixSegments.map((segment, index) => {
            const number = index + 1;
            const durationSeconds = Math.max(0.5, (segment.endMs - segment.startMs) / 1_000);
            return <section key={segment.id} className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-100">{instrumentMixText(lang, "segment")} {number}</p>
                  <p className="text-[11px] text-slate-500">{(segment.startMs / 1_000).toFixed(1)}s – {(segment.endMs / 1_000).toFixed(1)}s</p>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-slate-400 hover:text-red-300"
                  disabled={studio.instrumentMixSegments.length <= 1}
                  aria-label={instrumentMixText(lang, "remove", number)}
                  onClick={() => studio.removeInstrumentMixSection(segment.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)_112px] gap-3">
                <label className="space-y-1 text-xs text-slate-400">
                  <span>{instrumentMixText(lang, "instrument")}</span>
                  <select
                    className="h-10 w-full rounded-md border border-white/10 bg-[#0b0f14] px-3 text-sm text-slate-100 outline-none focus:border-amber-300/60"
                    value={segment.family}
                    aria-label={`${instrumentMixText(lang, "instrument")} ${number}`}
                    onChange={(event) => studio.setInstrumentMixFamily(segment.id, event.target.value as PhraseInstrumentFamily)}
                  >
                    {PHRASE_INSTRUMENT_SEQUENCE.map((family) => <option key={family} value={family}>
                      {showcaseText(lang, familyLabelKey(family))}
                    </option>)}
                  </select>
                </label>
                <label className="space-y-1 text-xs text-slate-400">
                  <span>{instrumentMixText(lang, "duration", number)}</span>
                  <InstrumentDurationInput
                    durationSeconds={durationSeconds}
                    label={instrumentMixText(lang, "duration", number)}
                    onCommit={(seconds) => studio.setInstrumentMixDuration(segment.id, seconds)}
                  />
                </label>
              </div>
            </section>;
          })}
        </div>

        <footer className="grid shrink-0 grid-cols-2 gap-2 border-t border-white/10 p-4">
          <Button type="button" variant="outline" className="border-white/10" onClick={studio.addInstrumentMixSection}>
            <Plus className="mr-2 h-4 w-4" />{instrumentMixText(lang, "add")}
          </Button>
          <Button type="button" variant="secondary" onClick={studio.resetInstrumentMixPlan}>
            <RotateCcw className="mr-2 h-4 w-4" />{instrumentMixText(lang, "reset")}
          </Button>
        </footer>
      </div>
    </SheetContent>
  </Sheet>;
});
