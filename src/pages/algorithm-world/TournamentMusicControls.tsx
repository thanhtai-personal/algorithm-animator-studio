import { Music2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ASSET_MUSIC_OPTIONS, type BackgroundMusicId } from "@/lib/backgroundMusic";
import { MUSIC_PRESETS } from "@/lib/i18n";
import type { AlgorithmStudio } from "@/pages/studio/useAlgorithmStudio";

type Props = {
  studio: AlgorithmStudio;
  t: (vi: string, en: string) => string;
};

type Track = {
  id: BackgroundMusicId;
  label: string;
  group: string;
};

export function TournamentMusicControls({ studio: s, t }: Props) {
  const tracks: Track[] = [
    ...MUSIC_PRESETS.map((item) => ({
      id: item.id as BackgroundMusicId,
      label: item.label[s.lang],
      group: item.id === "off" ? t("Tắt", "Off") : item.id === "custom" ? t("Upload", "Upload") : t("Preset", "Preset"),
    })),
    ...ASSET_MUSIC_OPTIONS.map((track) => ({
      id: track.id,
      label: track.label[s.lang],
      group: t("Có sẵn", "Bundled"),
    })),
    ...s.libraryMusicTracks.map((track) => ({
      id: track.id,
      label: track.title,
      group: track.licenseText ? "MUSIC_LIBRARY_DIR · License" : "MUSIC_LIBRARY_DIR",
    })),
  ];

  return (
    <Card className="space-y-3 border-cyan-300/20 bg-cyan-400/5 p-3">
      <div className="flex items-center gap-2">
        <Music2 className="h-4 w-4 text-cyan-200" />
        <Label>{t("Nhạc theo cảnh giải đấu", "Tournament scene music")}</Label>
      </div>
      <TournamentMusicSelect
        label={t("Start music", "Start music")}
        value={s.worldTournamentStartMusic}
        tracks={tracks}
        onChange={s.setWorldTournamentStartMusic}
      />
      <TournamentMusicSelect
        label={t("Music khi đua", "Race music")}
        value={s.worldTournamentRaceMusic}
        tracks={tracks}
        onChange={s.setWorldTournamentRaceMusic}
      />
      <TournamentMusicSelect
        label={t("Music kết quả", "Result music")}
        value={s.worldTournamentResultMusic}
        tracks={tracks}
        onChange={s.setWorldTournamentResultMusic}
      />
      <p className="text-xs text-muted-foreground">
        {t("Mặc định đều tắt. Nếu chọn Upload, dùng file đã upload ở tab Âm thanh.", "All default to off. Custom uses the uploaded file from the Audio tab.")}
      </p>
    </Card>
  );
}

function TournamentMusicSelect(props: {
  label: string;
  value: BackgroundMusicId;
  tracks: Track[];
  onChange: (value: BackgroundMusicId) => void;
}) {
  return (
    <div>
      <Label className="text-xs">{props.label}</Label>
      <Select value={props.value} onValueChange={(value) => props.onChange(value as BackgroundMusicId)}>
        <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
        <SelectContent>
          {props.tracks.map((track) => (
            <SelectItem key={track.id} value={track.id}>
              {track.label} · {track.group}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
