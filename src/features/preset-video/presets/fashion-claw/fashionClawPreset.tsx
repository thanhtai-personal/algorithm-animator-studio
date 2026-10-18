import type { PresetVideoDefinition } from "../../types";
import { FashionClawComposition } from "./FashionClawComposition";

export const fashionClawPreset: PresetVideoDefinition = {
  id: "fashion-claw",
  name: "Fashion Claw — Thay trang phục",
  description: "Video dọc 10 giây với kẹp kim loại chuyển động và những cú đổi trang phục liên tục. Tải ảnh người mẫu mặc từng bộ đồ, sắp xếp tùy ý rồi xuất MP4.",
  tags: ["fashion", "outfit", "claw", "lookbook", "reels", "shorts", "ảnh trang phục"],
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
