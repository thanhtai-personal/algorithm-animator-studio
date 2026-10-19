import type { MathChapter } from "./mathTimeline";
import { beatState } from "./MathReferenceBeats";
import { MathReferenceChapterA } from "./MathReferenceChapterA";
import { MathReferenceChapterB } from "./MathReferenceChapterB";

/**
 * Renderer for all 35 beats after the source's opening 40 seconds.
 * Transitions and motion use global Remotion frame only; every scene's
 * start/end are read from the same reference manifest as the player UI.
 */
export function MathChapterVisual({ chapter, frame }: { chapter: MathChapter; frame: number }) {
  const { cue, local, t } = beatState(frame);
  // Intro beat 01 is supplied by MathIntro; all following beats must agree
  // with the chapter selected by the frame-based player.
  if (cue.chapterId !== chapter.id) return null;
  const props = { frame, cue, local, t };
  if (["circle", "identity", "wave", "complement", "tangent"].includes(chapter.mode)) {
    return <MathReferenceChapterA {...props}/>;
  }
  return <MathReferenceChapterB {...props}/>;
}
