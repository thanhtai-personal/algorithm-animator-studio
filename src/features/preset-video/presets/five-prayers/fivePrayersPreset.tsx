import type { PresetVideoCompositionProps, PresetVideoDefinition } from "../../types";
import { FivePrayersComposition } from "./FivePrayersComposition";
import {
  FIVE_PRAYERS_DURATION_SECONDS,
  FIVE_PRAYERS_LYRIC_CUES,
} from "./fivePrayersContent";

function FivePrayersPresetComposition(props: PresetVideoCompositionProps) {
  return <FivePrayersComposition {...props} />;
}

export const fivePrayersPreset: PresetVideoDefinition = {
  id: "five-prayers",
  name: "5 Bài Kinh · Cầu Nguyện",
  description: "Tổng hợp 5 bài theo thứ tự 01 → 05, visual Remotion tạo sinh theo chủ đề Công giáo và caption lời kinh có thể chỉnh timing.",
  tags: ["prayer", "catholic", "lyrics", "meditation", "remotion"],
  accentColor: "#f6d58a",
  defaultDurationSeconds: FIVE_PRAYERS_DURATION_SECONDS,
  defaultFps: 30,
  defaultOutputPreset: "landscape-1080p",
  hasOriginalAudio: true,
  lyricTimingRevision: 1,
  editableLyrics: FIVE_PRAYERS_LYRIC_CUES,
  component: FivePrayersPresetComposition,
};
