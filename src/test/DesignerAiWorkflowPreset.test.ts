import { describe, expect, it } from "vitest";
import { designerAiWorkflowPreset } from "@/features/preset-video/presets/designer-ai-workflow/designerAiPreset";
import {
  DESIGNER_AI_DURATION_SECONDS,
  DESIGNER_AI_SOURCE_GROUP_ID,
  DESIGNER_AI_VIDEO_SOURCES,
} from "@/features/preset-video/presets/designer-ai-workflow/designerAiContent";
import { findRecommendedPresetMusic } from "@/features/preset-video/lib/presetVideoMusic";
import type { MusicLibraryTrack } from "@/lib/musicLibrary";

describe("Designer AI workflow preset", () => {
  it("summarizes the source recording into one grouped local-source workflow", () => {
    expect(designerAiWorkflowPreset.defaultDurationSeconds).toBe(DESIGNER_AI_DURATION_SECONDS);
    expect(designerAiWorkflowPreset.defaultOutputPreset).toBe("landscape-1080p");
    expect(designerAiWorkflowPreset.hasOriginalAudio).toBe(false);
    expect(designerAiWorkflowPreset.videoSourceStrategy).toBe("local");
    expect(designerAiWorkflowPreset.videoSources).toBe(DESIGNER_AI_VIDEO_SOURCES);
    expect(DESIGNER_AI_VIDEO_SOURCES).toHaveLength(8);

    for (const source of DESIGNER_AI_VIDEO_SOURCES) {
      expect(source.sourceGroupId).toBe(DESIGNER_AI_SOURCE_GROUP_ID);
      expect(source.clipEndSeconds).toBeGreaterThan(source.clipStartSeconds);
      expect(source.clipEndSeconds - source.clipStartSeconds).toBeLessThanOrEqual(20);
    }
  });

  it("ships both long-form and short-form social SEO copy", () => {
    const metadata = designerAiWorkflowPreset.socialMetadata;
    expect(metadata?.longForm.title).toContain("Designer");
    expect(metadata?.longForm.keywords).toContain("AI cho designer");
    expect(metadata?.shortForm.hashtags).toContain("#Shorts");
    expect(metadata?.shortForm.description.length).toBeGreaterThan(80);
  });

  it("recommends a matching future/ambient track when the library contains one", () => {
    const tracks: MusicLibraryTrack[] = [
      track("library:one", "Acoustic Morning", "acoustic-morning.mp3"),
      track("library:two", "Digital Future Ambient", "digital-future-ambient.mp3"),
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
