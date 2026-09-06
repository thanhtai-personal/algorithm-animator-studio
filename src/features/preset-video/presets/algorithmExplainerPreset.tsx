import { AlgorithmExplainerComposition } from "../../remotion-video/remotion/AlgorithmExplainerComposition";
import { DEFAULT_REMOTION_VIDEO } from "../../remotion-video/lib/remotionVideoTypes";
import type { PresetVideoCompositionProps, PresetVideoDefinition } from "../types";

function AlgorithmExplainerPresetComposition(props: PresetVideoCompositionProps) {
  return (
    <AlgorithmExplainerComposition
      {...DEFAULT_REMOTION_VIDEO}
      title="Bubble Sort — Code Preset"
      subtitle="Preset source-controlled trong Kai Studio, sẵn sàng preview và export lại."
      algorithmLabel="Bubble Sort"
      aspectRatio={props.aspectRatio === "9:16" ? "9:16" : "16:9"}
      durationSeconds={props.durationSeconds}
      fps={props.fps}
      backgroundMusicUrl=""
      voiceAudioUrl=""
      voiceVolume={props.originalAudioVolume}
    />
  );
}

export const algorithmExplainerPreset: PresetVideoDefinition = {
  id: "algorithm-explainer",
  name: "Algorithm Explainer",
  description: "Preset Remotion mẫu cho video giải thích thuật toán. Dùng làm reference khi AI thêm preset mới bằng git patch.",
  tags: ["remotion", "algorithm", "starter"],
  accentColor: "#38bdf8",
  defaultDurationSeconds: 18,
  defaultFps: 30,
  defaultOutputPreset: "landscape-1080p",
  hasOriginalAudio: false,
  component: AlgorithmExplainerPresetComposition,
};
