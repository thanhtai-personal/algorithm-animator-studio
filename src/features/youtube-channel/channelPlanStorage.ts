import type { ChannelIdea, YoutubeChannelPlan } from "./types";

const PLAN_KEY = "kai-studio.youtube.channelPlan.v1";

export const DEFAULT_CHANNEL_PLAN: YoutubeChannelPlan = {
  channelUrl: "https://www.youtube.com/channel/UCpKqiKf3QmCHGQNBlg8ngKA/",
  targetAudience: "Beginner developers, students, coding interview learners",
  contentPillars: "Algorithm visualized\nData structures visualized\nBig O explained\nCoding interview patterns\nJavaScript / React concepts",
  uploadCadence: "1 long video/week + 5 Shorts/week",
  defaultTags: "algorithm, programming, coding, computer science, visual learning, kai studio",
  pinnedComment: "Which algorithm should KAI STUDIO visualize next?",
  ideas: [
    createIdea("Bubble Sort Explained Visually", "long"),
    createIdea("Quick Sort in 30 Seconds", "short"),
    createIdea("Big O Explained With Animation", "long"),
  ],
};

export function readYoutubeChannelPlan(): YoutubeChannelPlan {
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    if (!raw) return DEFAULT_CHANNEL_PLAN;
    return { ...DEFAULT_CHANNEL_PLAN, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CHANNEL_PLAN;
  }
}

export function writeYoutubeChannelPlan(plan: YoutubeChannelPlan) {
  localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
}

export function createIdea(title = "New video idea", format: ChannelIdea["format"] = "short"): ChannelIdea {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    title,
    format,
    status: "idea",
  };
}
