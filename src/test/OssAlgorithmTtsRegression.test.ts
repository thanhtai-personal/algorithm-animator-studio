import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ALGORITHMS } from "@/lib/algorithms";
import { getRemotionDimensions, normalizeRemotionVideoInput, type RemotionVideoInputProps } from "@/features/remotion-video/lib/remotionVideoTypes";
import {
  generatePiperVoice, generateSupertonicVoice, generateVieneuVoice,
  generateGptSoVitsVoice, generateElevenLabsVoice, generateRvcApplioVoice,
  convertRvcApplioVoice, getVoiceHealth,
} from "@/lib/voiceApi";

describe("Algorithm OSS regressions", () => {
  it.each(["bubble", "insertion", "quick", "merge"])("%s sorts duplicate input without mutating the source", (algorithm) => {
    const input = [8, 2, 5, 2, 1];
    const frames = ALGORITHMS[algorithm].run(input);
    expect(frames.length).toBeGreaterThan(0);
    expect(frames.at(-1)?.arr).toEqual([1, 2, 2, 5, 8]);
    expect(input).toEqual([8, 2, 5, 2, 1]);
  });

  it("retains BFS and Dijkstra graph frame generation", () => {
    for (const algorithm of ["bfs", "dijkstra"]) {
      const frames = ALGORITHMS[algorithm].run([]);
      expect(frames.length).toBeGreaterThan(0);
      expect(frames.some((frame) => Boolean(frame.graph))).toBe(true);
    }
  });

  it("keeps Remotion dimensions and normalizes unsupported old story/news templates", () => {
    expect(getRemotionDimensions("16:9")).toEqual({ width: 1920, height: 1080 });
    expect(getRemotionDimensions("9:16")).toEqual({ width: 1080, height: 1920 });
    const legacy = "story-card" as unknown as RemotionVideoInputProps["template"];
    expect(normalizeRemotionVideoInput({ template: legacy, aspectRatio: "9:16" }).template).toBe("algorithm-explainer");
  });
});

describe("All six OSS voice provider client contracts", () => {
  const requests: { url: string; body?: string }[] = [];

  beforeEach(() => {
    requests.length = 0;
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      requests.push({ url: String(url), body: init?.body?.toString() });
      return {
        ok: true,
        headers: { get: () => "application/json" },
        json: async () => ({ ok: true }),
      };
    }));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("dispatches every original TTS and voice conversion endpoint", async () => {
    await generatePiperVoice({ text: "hello", modelKey: "voice", sentenceSilence: 0, speechRate: 1, fileName: "piper" });
    await generateSupertonicVoice({ text: "hello", voice: "default", lang: "en", speed: 1, totalSteps: 5, fileName: "supertonic" });
    await generateVieneuVoice({ text: "hello", fileName: "vieneu" });
    await generateGptSoVitsVoice({ text: "hello", fileName: "gptsovits" });
    await generateElevenLabsVoice({ text: "hello", modelId: "model", voiceId: "voice", fileName: "eleven" });
    await generateRvcApplioVoice({ text: "hello", fileName: "applio" });
    await convertRvcApplioVoice({ audioRelativePath: "audio/speech.wav" });
    expect(requests.map((request) => request.url)).toEqual([
      "/api/generate",
      "/api/supertonic/generate",
      "/api/vieneu/generate",
      "/api/gpt-sovits/generate",
      "/api/elevenlabs/generate",
      "/api/rvc-applio/tts",
      "/api/rvc-applio/convert",
    ]);
    expect(JSON.parse(requests[1].body || "{}").responseFormat).toBe("wav");
    expect(JSON.parse(requests[6].body || "{}").audioRelativePath).toBe("audio/speech.wav");
  });

  it("still requests the shared Piper/voice health endpoint", async () => {
    await getVoiceHealth();
    expect(requests.map((request) => request.url)).toEqual(["/api/health"]);
  });
});
