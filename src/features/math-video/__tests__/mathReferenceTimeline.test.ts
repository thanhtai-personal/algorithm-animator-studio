import { describe, expect, it } from "vitest";
import sourceManifest from "../../../../docs/video-references/math-sincos-v1.scene-manifest.json";
import { MATH_CHAPTERS, MATH_FPS, MATH_FRAMES, chapterAt } from "../mathTimeline";

describe("Task 04: source MP4 timeline coverage and mapping", () => {
  it("uses source metadata and explicit non-exact verification status", () => {
    expect(MATH_FPS).toBe(25);
    expect(MATH_FRAMES).toBe(15217);
    expect(sourceManifest.verification.coarseChapterBoundariesAuditedFromSource).toBe(true);
    expect(sourceManifest.verification.sourceShotBoundariesVerified).toBe(false);
    expect(sourceManifest.verification.audioRecreated).toBe(false);
    expect(sourceManifest.verification.sampleIntervalFrames).toBe(125);
  });

  it("maps the source-audited chapters into the player without drift", () => {
    expect(MATH_CHAPTERS).toHaveLength(12);
    expect(MATH_CHAPTERS.map((c) => [c.id, c.start, c.end])).toEqual(
      sourceManifest.sceneChapters.map((c) => [c.id, c.startFrame, c.endFrame]),
    );
    for (const [index, chapter] of MATH_CHAPTERS.entries()) {
      expect(chapter.start).toBe(index ? MATH_CHAPTERS[index - 1].end : 0);
      expect(chapter.end).toBeGreaterThan(chapter.start);
      expect(chapterAt(chapter.start).id).toBe(chapter.id);
      expect(chapterAt(chapter.end - 1).id).toBe(chapter.id);
    }
    expect(MATH_CHAPTERS.at(-1)?.end).toBe(MATH_FRAMES);
  });

  it("covers source frames [1000, 15217) with ordered reference beats", () => {
    const beats = sourceManifest.referenceBeats;
    expect(beats).toHaveLength(36);
    expect(beats[0].startFrame).toBe(1000);
    for (const [i, beat] of beats.entries()) {
      expect(beat.startFrame).toBe(i ? beats[i - 1].endFrame : 1000);
      expect(beat.endFrame).toBeGreaterThan(beat.startFrame);
      expect(beat.endFrame).toBeLessThanOrEqual(MATH_FRAMES);
      const chapter = chapterAt(beat.startFrame);
      expect(beat.chapterId).toBe(chapter.id);
      expect(beat.endFrame).toBeLessThanOrEqual(chapter.end);
      expect(beat.audio).toBe("not-transcribed-do-not-assume-timing");
    }
    expect(beats.at(-1)?.endFrame).toBe(MATH_FRAMES);
  });

  it("puts source key subjects in their observed time ranges", () => {
    expect(chapterAt(150 * MATH_FPS).mode).toBe("identity");
    expect(chapterAt(245 * MATH_FPS).mode).toBe("tangent");
    expect(chapterAt(355 * MATH_FPS).mode).toBe("sound");
    expect(chapterAt(450 * MATH_FPS).mode).toBe("height");
    expect(chapterAt(530 * MATH_FPS).mode).toBe("electric");
    expect(chapterAt(595 * MATH_FPS).mode).toBe("final");
  });
});
