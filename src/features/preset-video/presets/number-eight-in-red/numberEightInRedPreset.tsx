import type { PresetVideoCompositionProps, PresetVideoDefinition } from "../../types";
import { NumberEightInRedComposition } from "./NumberEightInRedComposition";
import {
  NUMBER_EIGHT_DURATION_SECONDS,
  NUMBER_EIGHT_LYRIC_CUES,
  NUMBER_EIGHT_VISUAL_SOURCES,
} from "./numberEightInRedContent";

function NumberEightInRedPresetComposition(props: PresetVideoCompositionProps) {
  return <NumberEightInRedComposition {...props} />;
}

export const numberEightInRedPreset: PresetVideoDefinition = {
  id: "number-eight-in-red",
  name: "Number Eight In Red",
  description: "Lyric video 3:48 cho bài hát Bruno Fernandes, dùng trích đoạn video ngắn từ video chính thức @manutd, motion chiến thuật và caption karaoke.",
  tags: ["music", "football", "lyrics", "bruno", "fair-use-oriented"],
  accentColor: "#da291c",
  defaultDurationSeconds: NUMBER_EIGHT_DURATION_SECONDS,
  defaultFps: 30,
  defaultOutputPreset: "landscape-1080p",
  hasOriginalAudio: true,
  editableLyrics: NUMBER_EIGHT_LYRIC_CUES,
  videoSources: NUMBER_EIGHT_VISUAL_SOURCES,
  component: NumberEightInRedPresetComposition,
};
