import { FileMusic, Music2 } from "lucide-react";
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
  return <ControlFrame title={t("section.song")} subtitle={studio.audioFileInfo}>
    <SelectField label={t("song.builtin")} value={studio.source.type === "builtin" ? studio.source.name : "imported"} options={[{ value: "imported", label: t("song.imported") }, ...Object.keys(BUILTIN_MELODIES).map((name) => ({ value: name, label: melodyLabel(lang, name) }))]} onChange={(value) => value !== "imported" && studio.loadBuiltin(value)} />
    <UploadCard icon={FileMusic} title={t("song.uploadMidi")} hint={t("song.uploadMidiHint")} accept=".mid,.midi,audio/midi" onFile={studio.importMidi} />
    <UploadCard icon={Music2} title={t("song.uploadAudio")} hint={t("song.uploadAudioHint")} accept="audio/*" onFile={studio.importAudio} />
    <ToggleField label={t("song.playOriginal")} checked={studio.settings.playOriginalSong} onChange={(value) => studio.patch("playOriginalSong", value)} />
    <RangeField label={t("song.playbackSpeed")} value={studio.settings.playbackSpeed} min={0.35} max={2} step={0.05} unit="×" onChange={(value) => studio.patch("playbackSpeed", value)} />
    <RangeField label={t("song.syncOffset")} value={studio.settings.syncOffsetMs} min={-400} max={400} step={5} unit="ms" onChange={(value) => studio.patch("syncOffsetMs", value)} />
  </ControlFrame>;
}
