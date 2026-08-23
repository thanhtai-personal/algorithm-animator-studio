import type { RhythmicStudioController } from "../../hooks/useRhythmicStudioController";
import { LayoutFrame } from "../sections/LayoutFrame";
import { MediaFrame } from "../sections/MediaFrame";
import { MotionFrame } from "../sections/MotionFrame";
import { SoundFrame } from "../sections/SoundFrame";
import { SourceFrame } from "../sections/SourceFrame";
import { TerrainFrame } from "../sections/TerrainFrame";
import { VisualFrame } from "../sections/VisualFrame";

export function RhythmicLeftControls({ studio }: { studio: RhythmicStudioController }) {
  return <aside className="space-y-3 xl:max-h-[calc(100dvh-150px)] xl:overflow-y-auto xl:pr-1">
    <SourceFrame studio={studio} />
    <TerrainFrame studio={studio} />
    <LayoutFrame studio={studio} />
  </aside>;
}

export function RhythmicRightControls({ studio }: { studio: RhythmicStudioController }) {
  return <aside className="space-y-3 xl:max-h-[calc(100dvh-150px)] xl:overflow-y-auto xl:pl-1">
    <MotionFrame studio={studio} />
    <VisualFrame studio={studio} />
    <MediaFrame studio={studio} />
    <SoundFrame studio={studio} />
  </aside>;
}
