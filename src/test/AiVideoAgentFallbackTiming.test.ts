import { describe, expect, it } from "vitest";
import { createAgentVideoPlan } from "../../server/services/AiVideoAgentService";

describe("AI video agent fallback timing", () => {
  it("ignores target seconds and uses the agent preset duration for local fallback plans", async () => {
    const plan = await createAgentVideoPlan({
      agentPreset: "algorithm-long",
      platform: "youtube-long",
      language: "vi",
      targetDurationSec: 45,
      topic: "Binary search",
    }, {
      AI_AGENT_PROVIDER: "gemini",
      AI_SHORTS_API_KEY: "",
      OPENAI_API_KEY: "",
    });

    expect(plan.warning).toContain("fallback");
    expect(plan.scenes.reduce((total, scene) => total + scene.durationSec, 0)).toBe(240);
  });
});
