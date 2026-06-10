export type RemotionVideoAspectRatio = "16:9" | "9:16";
export type RemotionVideoTemplate = "algorithm-explainer" | "news-card" | "story-card";

export type RemotionVideoRenderBody = {
  title?: string;
  subtitle?: string;
  template?: RemotionVideoTemplate;
  aspectRatio?: RemotionVideoAspectRatio;
  durationSeconds?: number;
  fps?: number;
  primaryColor?: string;
  accentColor?: string;
  algorithmLabel?: string;
  data?: number[];
  narration?: string;
  watermark?: string;
};

export type NormalizedRemotionVideoInput = Required<RemotionVideoRenderBody>;
