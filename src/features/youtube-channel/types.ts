import type { YoutubeUploadForm } from "@/lib/youtubeApi";

export type AuthStatus = "loading" | "allowed" | "denied";

export type ChannelIdea = {
  id: string;
  title: string;
  format: "short" | "long" | "series";
  status: "idea" | "script" | "recording" | "uploaded";
};

export type YoutubeChannelPlan = {
  channelUrl: string;
  targetAudience: string;
  contentPillars: string;
  uploadCadence: string;
  defaultTags: string;
  pinnedComment: string;
  ideas: ChannelIdea[];
};

export type YoutubeManagerState = {
  authStatus: AuthStatus;
  loading: boolean;
  refreshToken: string;
  plan: YoutubeChannelPlan;
  form: YoutubeUploadForm;
};
