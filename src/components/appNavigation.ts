import {
  Clapperboard,
  Download,
  Files,
  Film,
  Github,
  Home,
  ListChecks,
  Map,
  Music2,
  MicVocal,
  Newspaper,
  PenLine,
  Settings,
  Sparkles,
  Video,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import type { Lang } from "@/lib/i18n";
import type { MenuFeatureId, MenuFeatureSettings } from "@/lib/menuFeatureSettings";

export type AppNavigationItem = {
  id: string;
  to: string;
  icon: LucideIcon;
  label: Record<Lang, string>;
  matchPaths?: string[];
  featureId?: MenuFeatureId;
};

export type AppNavigationGroup = {
  id: string;
  label: Record<Lang, string>;
  items: AppNavigationItem[];
};

export const APP_TITLE = "KAI STUDIO";

export const APP_NAVIGATION_GROUPS: AppNavigationGroup[] = [
  {
    id: "algorithm-production",
    label: { en: "Algorithm Studio", vi: "Thuật toán" },
    items: [
      {
        id: "algorithm-studio",
        featureId: "algorithm-studio",
        to: "/algorithms",
        icon: Home,
        label: { en: "Algorithm Video", vi: "Video thuật toán" },
        matchPaths: ["/algorithms", "/algorithms/agentic", "/algorithms/manual", "/algorithms/short"],
      },
      {
        id: "rhythmic-studio",
        featureId: "rhythmic-studio",
        to: "/algorithms/rhythmic",
        icon: Music2,
        label: { en: "Rhythmic Studio", vi: "Video nhịp điệu" },
        matchPaths: ["/algorithms/rhythmic"],
      },
      {
        id: "maze-pathfinding",
        featureId: "maze-pathfinding",
        to: "/algorithms/maze",
        icon: Map,
        label: { en: "Maze Pathfinding", vi: "Tìm đường mê cung" },
        matchPaths: ["/algorithms/maze", "/algorithms/maze/agentic", "/algorithms/maze/manual", "/maze-pathfinding", "/maze-pathfinding/agentic", "/maze-pathfinding/manual", "/algorithm-world"],
      },
      {
        id: "algorithm-long",
        featureId: "algorithm-long",
        to: "/algorithms/video-long",
        icon: Video,
        label: { en: "Algorithm Long", vi: "Video thuật toán dài" },
        matchPaths: ["/algorithms/video-long", "/algorithms/video-long/agentic", "/algorithms/video-long/manual", "/long-content", "/long-content/agentic", "/long-content/manual"],
      },
    ],
  },
  {
    id: "news-channels",
    label: { en: "News Channels", vi: "Kênh tin tức" },
    items: [
      {
        id: "github-trending",
        featureId: "github-trending",
        to: "/news/github-trending",
        icon: Github,
        label: { en: "GitHub Trend Video", vi: "Video GitHub trend" },
        matchPaths: ["/news/github-trending", "/news/github-trending/agentic", "/news/github-trending/manual", "/algorithms/github-trending", "/github-trending"],
      },
      {
        id: "football-commentary",
        featureId: "football-commentary",
        to: "/news/football-commentary",
        icon: Newspaper,
        label: { en: "Football Commentary", vi: "Bình luận bóng đá" },
        matchPaths: ["/news/football-commentary", "/news/football-commentary/agentic", "/news/football-commentary/manual", "/football/commentary/agentic", "/football/commentary/manual", "/football/mu-news", "/mu-news"],
      },
    ],
  },
  {
    id: "story-production",
    label: { en: "Story Studio", vi: "Truyện" },
    items: [
      {
        id: "story-studio",
        featureId: "story-studio",
        to: "/stories",
        icon: Clapperboard,
        label: { en: "Story Video", vi: "Video truyện" },
        matchPaths: ["/stories", "/stories/agentic", "/stories/manual", "/stories/video", "/story-video"],
      },
      {
        id: "story-author",
        featureId: "story-author",
        to: "/stories/create",
        icon: PenLine,
        label: { en: "Story Author", vi: "Sáng tác truyện" },
        matchPaths: ["/stories/create", "/story-author"],
      },
      {
        id: "story-review",
        featureId: "story-review",
        to: "/stories/review",
        icon: Sparkles,
        label: { en: "Story Review", vi: "Review truyện" },
        matchPaths: ["/stories/review", "/stories/review/agentic", "/stories/review/manual", "/story-review", "/story-review/agentic", "/story-review/manual"],
      },
    ],
  },
  {
    id: "common-video-tools",
    label: { en: "Common Video", vi: "Video chung" },
    items: [
      {
        id: "common-video",
        featureId: "common-video",
        to: "/videos",
        icon: Film,
        label: { en: "Create Video", vi: "Tạo video" },
        matchPaths: ["/videos", "/videos/agentic", "/videos/manual", "/ai-video-agent", "/video-create"],
      },
      {
        id: "text-to-speech",
        featureId: "text-to-speech",
        to: "/text-to-speech",
        icon: MicVocal,
        label: { en: "Text to Speech", vi: "Text to Speech" },
        matchPaths: ["/text-to-speech"],
      },
      {
        id: "youtube-tools",
        featureId: "youtube-tools",
        to: "/youtube-tools",
        icon: Download,
        label: { en: "YouTube Tools", vi: "Tải YouTube" },
        matchPaths: ["/youtube-tools"],
      },
    ],
  },
  {
    id: "manage",
    label: { en: "Manage", vi: "Quản lý" },
    items: [
      {
        id: "jobs",
        featureId: "jobs",
        to: "/jobs",
        icon: ListChecks,
        label: { en: "Job Manager", vi: "Quản lý job" },
        matchPaths: ["/jobs"],
      },
      {
        id: "channel",
        featureId: "channel",
        to: "/channel",
        icon: Youtube,
        label: { en: "Channel Manager", vi: "Quản lý kênh" },
        matchPaths: ["/channel", "/youtube", "/youtube-publishing", "/social-publishing"],
      },
      {
        id: "assets",
        featureId: "assets",
        to: "/assets",
        icon: Files,
        label: { en: "Files Management", vi: "Quản lý file" },
        matchPaths: ["/assets"],
      },
      {
        id: "settings",
        to: "/settings",
        icon: Settings,
        label: { en: "Settings", vi: "Cài đặt" },
        matchPaths: ["/settings"],
      },
    ],
  },
];

export function filterNavigationGroupsByFeatures(
  groups: AppNavigationGroup[],
  settings: MenuFeatureSettings,
): AppNavigationGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.featureId || settings[item.featureId]),
    }))
    .filter((group) => group.items.length > 0);
}

export const APP_NAVIGATION: AppNavigationItem[] = APP_NAVIGATION_GROUPS.flatMap((group) => group.items);

export function getActiveNavigationItem(pathname: string) {
  return APP_NAVIGATION.find((item) => item.matchPaths?.some((path) => path === pathname)) ?? APP_NAVIGATION[0];
}
