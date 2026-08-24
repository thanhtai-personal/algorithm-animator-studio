import { Volume2 } from "lucide-react";
import { useSystemLang } from "@/hooks/use-system-lang";
import { rhythmicText, type RhythmicTextKey } from "../../i18n";
import { SYNTH_PRESETS, type StudioSettings } from "../../types";
import type { RhythmicStudioController } from "../../hooks/useRhythmicStudioController";
import { ControlFrame } from "../atoms/ControlFrame";
import { RangeField, SelectField, ToggleField } from "../atoms/ControlFields";

export function SoundFrame({ studio }: { studio: RhythmicStudioController }) {
  const lang = useSystemLang();
  const t = (key: RhythmicTextKey) => rhythmicText(lang, key);
  const synthOptions = SYNTH_PRESETS.map((value) => ({ value, label: t(`synth.${value}` as RhythmicTextKey) }));
  const midiOptions = (["auto", "single"] as const).map((value) => ({ value, label: t(`midiMode.${value}` as RhythmicTextKey) }));
  const s = studio.settings;
  return <ControlFrame title={t("section.sound")} icon={<Volume2 className="h-4 w-4 text-primary" />} defaultOpen={false}>
    <ToggleField label={t("sound.midiPlayback")} checked={s.midiPlaybackEnabled} onChange={(value) => studio.patch("midiPlaybackEnabled", value)} />
    <SelectField label={t("sound.midiMode")} value={s.midiInstrumentMode} options={midiOptions} onChange={(value) => studio.patch("midiInstrumentMode", value as StudioSettings["midiInstrumentMode"])} />
    <ToggleField label={t("sound.instrumentNativeAudio")} checked={s.instrumentNativeAudio} onChange={(value) => studio.patch("instrumentNativeAudio", value)} />
    <SelectField label={t("sound.hitSynth")} value={s.synthPreset} options={synthOptions} onChange={(value) => studio.patch("synthPreset", value as StudioSettings["synthPreset"])} />
    <RangeField label={t("sound.synthVolume")} value={s.synthVolume} min={0} max={0.75} step={0.01} onChange={(value) => studio.patch("synthVolume", value)} />
    <RangeField label={t("sound.reverb")} value={s.synthReverb} min={0} max={0.8} step={0.02} onChange={(value) => studio.patch("synthReverb", value)} />
    <RangeField label={t("sound.brightness")} value={s.synthBrightness} min={0} max={1} step={0.02} onChange={(value) => studio.patch("synthBrightness", value)} />
    <RangeField label={t("sound.stereoWidth")} value={s.synthStereoWidth} min={0} max={1} step={0.02} onChange={(value) => studio.patch("synthStereoWidth", value)} />
  </ControlFrame>;
}
