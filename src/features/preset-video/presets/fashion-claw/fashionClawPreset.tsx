import type { PresetVideoDefinition } from "../../types";
import { FashionClawComposition } from "./FashionClawComposition";

export const fashionClawPreset: PresetVideoDefinition = {
  id: "fashion-claw",
  name: "Fashion Fan — Sofa Outfit Spin",
  description: "Góc quay từ trên xuống: quạt trần 3 cánh, sofa hồng, thảm xanh và người mẫu lăn vào cảnh rồi thay trang phục theo nhịp cánh quạt. Chọn ảnh tùy ý để dựng video.",
  tags: ["fashion", "outfit", "ceiling-fan", "sofa", "lookbook", "reels", "shorts", "ảnh trang phục"],
  accentColor: "#c99a71",
  // Exact source cadence: 296 frames at 30 FPS, rather than 300 frames / 10s.
  defaultDurationSeconds: 296 / 30,
  defaultFps: 30,
  defaultOutputPreset: "portrait-1080p",
  hasOriginalAudio: false,
  settingsRevision: 1,
  videoSourceStrategy: "local",
  musicRecommendation: {
    mood: "fashion editorial / runway beat",
    keywords: ["runway", "fashion", "beat", "editorial", "pop"],
    rationale: "Nhạc có nhịp rõ giúp chuyển trang phục đồng bộ với quạt trần.",
    defaultVolume: 0.2,
  },
  component: FashionClawComposition,
};
