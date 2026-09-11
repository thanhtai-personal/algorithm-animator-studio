import { Music2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MusicLibraryTrack } from "@/lib/musicLibrary";
import type { PresetVideoDefinition, PresetVideoExportSettings } from "../types";
import { MusicPreview, VolumeSlider } from "./PresetVideoControls";

type Props = {
  preset: PresetVideoDefinition;
  settings: PresetVideoExportSettings;
  tracks: readonly MusicLibraryTrack[];
  selectedTrack?: MusicLibraryTrack;
  musicLoading: boolean;
  onChange: (patch: Partial<PresetVideoExportSettings>) => void;
};

export function PresetVideoMusicSettings(props: Props) {
  return (
    <>
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Music2 className="h-4 w-4" />
          Nhạc nền
        </Label>
        <Select
          value={props.settings.backgroundMusicId || "none"}
          disabled={props.musicLoading}
          onValueChange={(value) => props.onChange({ backgroundMusicId: value === "none" ? "" : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder={props.musicLoading ? "Đang tải..." : "Không dùng nhạc"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Không dùng nhạc</SelectItem>
            {props.tracks.map((track) => (
              <SelectItem key={track.id} value={track.id}>{track.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {props.selectedTrack ? (
          <MusicPreview src={props.selectedTrack.audioUrl} volume={props.settings.backgroundMusicVolume} />
        ) : null}
        {props.preset.musicRecommendation ? (
          <p className="text-xs leading-5 text-muted-foreground">
            Gợi ý: <span className="font-medium text-foreground/80">{props.preset.musicRecommendation.mood}</span>
            {" · "}{props.preset.musicRecommendation.rationale}
          </p>
        ) : null}
      </div>

      <VolumeSlider
        label="Music volume"
        value={props.settings.backgroundMusicVolume}
        onChange={(value) => props.onChange({ backgroundMusicVolume: value })}
      />
      {props.preset.hasOriginalAudio ? (
        <VolumeSlider
          label="Original audio"
          value={props.settings.originalAudioVolume}
          onChange={(value) => props.onChange({ originalAudioVolume: value })}
        />
      ) : (
        <p className="text-xs text-muted-foreground">Preset này không khai báo original audio.</p>
      )}
    </>
  );
}
