import { describe, expect, it } from "vitest";
import { createClipFromAsset, getDefaultClipDuration } from "@/features/video-editor/lib/videoEditorAssetHelpers";
import { normalizeEditorLyrics } from "@/features/video-editor/lib/videoEditorLyrics";
import type { VideoEditorAsset } from "@/features/video-editor/lib/videoEditorTypes";

function makeAsset(overrides: Partial<VideoEditorAsset>): VideoEditorAsset {
  const type = overrides.type || "audio";
  return {
    id: overrides.id || "asset-1",
    type,
    file: new File([], type === "video" ? "clip.mp4" : "song.mp3", { type: type === "video" ? "video/mp4" : "audio/mpeg" }),
    name: overrides.name || "media",
    url: overrides.url || "blob:test",
    ...overrides,
  };
}

describe("video editor media defaults", () => {
  it("uses the measured audio duration as the default clip duration", () => {
    const asset = makeAsset({ type: "audio", durationSeconds: 264.044 });
    expect(getDefaultClipDuration(asset)).toBe(264.044);
    expect(createClipFromAsset(asset).durationSeconds).toBe(264.044);
  });

  it("uses the measured video duration while keeping silence editable at the legacy 12s default", () => {
    expect(getDefaultClipDuration(makeAsset({ type: "video", durationSeconds: 17.81234 }))).toBe(17.812);
    expect(getDefaultClipDuration(makeAsset({ type: "audio", source: "silent", durationSeconds: 1 }))).toBe(12);
  });
});

describe("video editor lyric reset baseline", () => {
  it("preserves the last auto-generated cues separately from the editable cues", () => {
    const lyrics = normalizeEditorLyrics({
      cues: [{ id: "edited", start: 1, end: 2, text: "edited", words: [] }],
      generatedCues: [{ id: "generated", start: 1, end: 2, text: "generated", words: [] }],
    });
    expect(lyrics.cues[0].text).toBe("edited");
    expect(lyrics.generatedCues?.[0].text).toBe("generated");
  });
});
