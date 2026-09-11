import { describe, expect, it } from "vitest";
import { designerAiWorkflowPreset } from "@/features/preset-video/presets/designer-ai-workflow/designerAiPreset";
import {
  DESIGNER_AI_CODE_SOURCE_GROUP_ID,
  DESIGNER_AI_DESIGN_SOURCE_GROUP_ID,
  DESIGNER_AI_DURATION_SECONDS,
  DESIGNER_AI_CODE_SOURCE_GROUP_LABEL,
  DESIGNER_AI_DESIGN_SOURCE_GROUP_LABEL,
  DESIGNER_AI_SEGMENTS,
  DESIGNER_AI_VIDEO_SOURCES,
} from "@/features/preset-video/presets/designer-ai-workflow/designerAiContent";
import { findRecommendedPresetMusic } from "@/features/preset-video/lib/presetVideoMusic";
import type { MusicLibraryTrack } from "@/lib/musicLibrary";

describe("Designer AI workflow preset", () => {
  it("continues the Stitch design session into one Codex implementation phase", () => {
    expect(designerAiWorkflowPreset.defaultDurationSeconds).toBe(DESIGNER_AI_DURATION_SECONDS);
    expect(DESIGNER_AI_DURATION_SECONDS).toBe(78);
    expect(designerAiWorkflowPreset.defaultOutputPreset).toBe("landscape-1080p");
    expect(designerAiWorkflowPreset.hasOriginalAudio).toBe(false);
    expect(designerAiWorkflowPreset.videoSourceStrategy).toBe("local");
    expect(designerAiWorkflowPreset.videoSources).toBe(DESIGNER_AI_VIDEO_SOURCES);
    expect(DESIGNER_AI_VIDEO_SOURCES).toHaveLength(12);

    const designSources = DESIGNER_AI_VIDEO_SOURCES.filter(
      (source) => source.sourceGroupId === DESIGNER_AI_DESIGN_SOURCE_GROUP_ID,
    );
    const codeSources = DESIGNER_AI_VIDEO_SOURCES.filter(
      (source) => source.sourceGroupId === DESIGNER_AI_CODE_SOURCE_GROUP_ID,
    );

    expect(designSources).toHaveLength(8);
    expect(codeSources).toHaveLength(4);
    expect(designSources.every((source) => source.sourceGroupLabel === DESIGNER_AI_DESIGN_SOURCE_GROUP_LABEL)).toBe(true);
    expect(codeSources.every((source) => source.sourceGroupLabel === DESIGNER_AI_CODE_SOURCE_GROUP_LABEL)).toBe(true);
    expect(DESIGNER_AI_SEGMENTS[DESIGNER_AI_SEGMENTS.length - 1]?.phase).toBe("code");
    expect(DESIGNER_AI_SEGMENTS[7]?.phase).toBe("handoff");
    expect(DESIGNER_AI_SEGMENTS.every((segment) => segment.impact.length <= 11)).toBe(true);

    for (const source of DESIGNER_AI_VIDEO_SOURCES) {
      expect(source.clipEndSeconds).toBeGreaterThan(source.clipStartSeconds);
      expect(source.clipEndSeconds - source.clipStartSeconds).toBeLessThanOrEqual(20);
    }
  });

  it("keeps the timeline continuous through the design-to-code handoff", () => {
    expect(DESIGNER_AI_SEGMENTS[0]?.start).toBe(0);
    expect(DESIGNER_AI_SEGMENTS[DESIGNER_AI_SEGMENTS.length - 1]?.end).toBe(DESIGNER_AI_DURATION_SECONDS);

    for (let index = 1; index < DESIGNER_AI_SEGMENTS.length; index += 1) {
      expect(DESIGNER_AI_SEGMENTS[index]?.start).toBe(DESIGNER_AI_SEGMENTS[index - 1]?.end);
    }
  });

  it("ships both long-form and short-form social SEO copy for the extended workflow", () => {
    const metadata = designerAiWorkflowPreset.socialMetadata;
    expect(metadata?.longForm.title).toContain("Stitch");
    expect(metadata?.longForm.keywords).toContain("AI cho designer");
    expect(metadata?.longForm.keywords).toContain("design to code AI");
    expect(metadata?.shortForm.hashtags).toContain("#Shorts");
    expect(metadata?.shortForm.description).toContain("Codex");
  });

  it("recommends a matching future/ambient track when the library contains one", () => {
    const tracks: MusicLibraryTrack[] = [
      track("library:one", "Acoustic Morning", "acoustic-morning.mp3"),
      track("library:two", "Digital Future Glitch Pulse", "digital-future-glitch-pulse.mp3"),
    ];

    expect(findRecommendedPresetMusic(tracks, designerAiWorkflowPreset.musicRecommendation)?.id)
      .toBe("library:two");
  });
});

function track(id: MusicLibraryTrack["id"], title: string, fileName: string): MusicLibraryTrack {
  return {
    id,
    title,
    folderName: title,
    fileName,
    audioUrl: `http://localhost/${fileName}`,
  };
}
