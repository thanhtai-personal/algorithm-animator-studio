import { describe, expect, it } from "vitest";
import { buildAgentRemotionVideoInput, normalizeAgentRenderSettings } from "../../server/services/AiVideoAgentRemotionRender";
import type { AgentVideoJob } from "../../server/models/AiVideoAgent";

describe("AiVideoAgentRemotionRender", () => {
  it("builds Remotion module input from selected agent render settings", () => {
    const job = makeJob({
      platform: "youtube-long",
      renderTitle: "Custom GitHub title",
      renderSubtitle: "Custom subtitle",
      renderNarration: "Custom narration",
      renderTemplate: "news-card",
      renderAspectRatio: "16:9",
      renderData: "12, 48, 101, bad, 4",
      renderAlgorithmLabel: "GitHub Trend",
      renderBackgroundMusicUrl: "/generated/music.wav",
      renderVoiceVolume: 0.75,
      renderBackgroundMusicVolume: 0.2,
    });

    const input = buildAgentRemotionVideoInput({ job, narration: "Generated narration" });

    expect(input).toMatchObject({
      title: "Custom GitHub title",
      subtitle: "Custom subtitle",
      narration: "Custom narration",
      template: "news-card",
      aspectRatio: "16:9",
      algorithmLabel: "GitHub Trend",
      voiceAudioUrl: "/generated/audio.wav",
      backgroundMusicUrl: "/generated/music.wav",
      voiceVolume: 0.75,
      backgroundMusicVolume: 0.2,
    });
    expect(input.data).toEqual([12, 48, 100, 5]);
  });

  it("uses platform aspect ratio and module defaults when render fields are missing", () => {
    const settings = normalizeAgentRenderSettings({
      kind: "algorithm",
      platform: "youtube-short",
      language: "vi",
      agentPreset: "algorithm-shorts",
      renderFps: 120,
    });
    const job = makeJob(settings);

    const input = buildAgentRemotionVideoInput({ job, narration: "Generated narration" });

    expect(input.template).toBe("algorithm-explainer");
    expect(input.aspectRatio).toBe("9:16");
    expect(input.fps).toBe(60);
    expect(input.title).toBe("Fallback plan title");
    expect(input.narration).toBe("Generated narration");
  });

  it("uses plan scene duration instead of target seconds for render duration", () => {
    const job = makeJob({ targetDurationSec: 45 });
    job.plan!.scenes = [
      { id: "scene-1", title: "A", narration: "A", onScreenText: "A", visualPrompt: "A", durationSec: 30 },
      { id: "scene-2", title: "B", narration: "B", onScreenText: "B", visualPrompt: "B", durationSec: 30 },
      { id: "scene-3", title: "C", narration: "C", onScreenText: "C", visualPrompt: "C", durationSec: 30 },
      { id: "scene-4", title: "D", narration: "D", onScreenText: "D", visualPrompt: "D", durationSec: 30 },
    ];

    const input = buildAgentRemotionVideoInput({ job, narration: "Generated narration" });

    expect(input.durationSeconds).toBe(120);
  });
});

function makeJob(input: Partial<AgentVideoJob["input"]>): AgentVideoJob {
  return {
    id: "job-1",
    status: "running",
    createdAtMs: 1,
    updatedAtMs: 1,
    input: {
      topic: "GitHub trending repo",
      kind: "algorithm",
      platform: "youtube-short",
      language: "vi",
      tone: "Nhanh",
      targetDurationSec: 45,
      extraInstruction: "",
      agentPreset: "github-trending",
      voiceProvider: "piper",
      piperModelKey: "vi_vais1000",
      elevenModelId: "eleven_flash_v2_5",
      elevenVoiceId: "",
      supertonicVoice: "M1",
      supertonicTotalSteps: 8,
      vieneuVoiceId: "",
      vieneuMode: "turbo",
      vieneuEmotion: "natural",
      applioTtsTemplateId: "",
      speechRate: 0.9,
      sentenceSilence: 0.25,
      renderTitle: "",
      renderSubtitle: "",
      renderNarration: "",
      renderTemplate: "algorithm-explainer",
      renderAspectRatio: "auto",
      renderFps: 30,
      renderPrimaryColor: "#020617",
      renderAccentColor: "#38bdf8",
      renderAlgorithmLabel: "Bubble Sort",
      renderData: "18, 42, 27, 64, 33",
      renderWatermark: "KAI STUDIO",
      renderBackgroundMusicUrl: "",
      renderVoiceVolume: 0.9,
      renderBackgroundMusicVolume: 0.22,
      autoCreatePublishJobs: false,
      publishTargets: ["youtube"],
      publishChannels: [],
      publishScheduledAt: "",
      publishPrivacyStatus: "private",
      ...input,
    },
    progress: 50,
    steps: [],
    logs: [],
    plan: {
      title: "Fallback plan title",
      description: "Fallback description",
      tags: ["agent"],
      hook: "Fallback hook",
      thumbnailPrompt: "",
      scenes: [],
      publishNotes: [],
      warning: "AI unavailable",
    },
    artifacts: {
      audioRelativePath: "generated/audio.wav",
      audioUrl: "/generated/audio.wav",
    },
  };
}
