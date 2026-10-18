import type { PresetVideoDefinition } from "../../types";
import { FashionClawComposition } from "./FashionClawComposition";

export const fashionClawPreset: PresetVideoDefinition = {
  id: "fashion-claw",
  name: "Fashion Fan — Sofa Outfit Spin",
  description: "Góc quay từ trên xuống: quạt trần 3 cánh, sofa hồng, thảm xanh và người mẫu lăn vào cảnh rồi thay trang phục theo nhịp cánh quạt. Chọn ảnh tùy ý để dựng video.",
  tags: ["fashion", "outfit", "ceiling-fan", "sofa", "lookbook", "reels", "shorts", "ảnh trang phục"],
  accentColor: "#c99a71",
  defaultDurationSeconds: 10,
  defaultFps: 30,
  defaultOutputPreset: "portrait-1080p",
  hasOriginalAudio: false,
  settingsRevision: 1,
  videoSourceStrategy: "local",
  musicRecommendation: {
    mood: "fashion editorial / runway beat",
    keywords: ["runway", "fashion", "beat", "editorial", "pop"],
    rationale: "Nhạc có nhịp rõ giúp chuyển trang phục đồng bộ với kẹp kim loại.",
    defaultVolume: 0.2,
  },
  component: FashionClawComposition,
};
