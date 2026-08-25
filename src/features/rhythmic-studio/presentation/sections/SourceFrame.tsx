import { Music2 } from "lucide-react";
import { useSystemLang } from "@/hooks/use-system-lang";
import { BUILTIN_MELODIES } from "../../defaults";
import { melodyLabel, rhythmicText } from "../../i18n";
import type { RhythmicStudioController } from "../../hooks/useRhythmicStudioController";
import { ControlFrame } from "../atoms/ControlFrame";
import { RangeField, SelectField, ToggleField } from "../atoms/ControlFields";
import { UploadCard } from "../atoms/UploadCard";

export function SourceFrame({ studio }: { studio: RhythmicStudioController }) {
  const lang = useSystemLang();
  const t = (key: Parameters<typeof rhythmicText>[1]) => rhythmicText(lang, key);
  const s = studio.settings;
  return <ControlFrame title={t("section.song")} subtitle={studio.audioFileInfo} defaultOpen={true}>
    <SelectField label={t("song.builtin")} value={studio.source.type === "builtin" ? studio.source.name : "imported"} options={[{ value: "imported", label: t("song.imported") }, ...Object.keys(BUILTIN_MELODIES).map((name) => ({ value: name, label: melodyLabel(lang, name) }))]} onChange={(value) => value !== "imported" && studio.loadBuiltin(value)} />
    <UploadCard icon={Music2} title={t("song.uploadAudio")} hint={t("song.uploadAudioHint")} accept="audio/*" onFile={studio.importAudio} />
    {studio.source.type === "midi"
      ? <ToggleField label={t("sound.midiPlayback")} checked={s.midiPlaybackEnabled} onChange={(value) => void studio.setSourceAudioEnabled(value)} />
      : studio.source.type === "audio"
        ? <ToggleField label={t("song.playOriginal")} checked={s.playOriginalSong} onChange={(value) => void studio.setSourceAudioEnabled(value)} />
        : null}
    <RangeField label={t("sound.musicVolume")} value={Math.round(s.musicVolume * 100)} min={0} max={160} step={5} unit="%" onChange={(value) => studio.patch("musicVolume", value / 100)} />
    <RangeField label={t("song.playbackSpeed")} value={s.playbackSpeed} min={0.35} max={2} step={0.05} unit="×" onChange={(value) => studio.patch("playbackSpeed", value)} />
    <RangeField label={t("song.syncOffset")} value={s.syncOffsetMs} min={-400} max={400} step={5} unit="ms" onChange={(value) => studio.patch("syncOffsetMs", value)} />
  </ControlFrame>;
}
