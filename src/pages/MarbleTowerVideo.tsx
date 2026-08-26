import { RhythmicStudioProvider } from "@/features/rhythmic-studio";
import { MarbleTowerVideoWorkspace } from "@/features/marble-tower-video/MarbleTowerVideoWorkspace";

export default function MarbleTowerVideo() {
  return <RhythmicStudioProvider><MarbleTowerVideoWorkspace /></RhythmicStudioProvider>;
}
