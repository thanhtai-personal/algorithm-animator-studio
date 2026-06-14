import {
  Clapperboard,
  Files,
  Film,
  Home,
  Map,
  Newspaper,
  MicVocal,
  PenLine,
  Settings,
  Sparkles,
  Video,
  Youtube,
  Bot,
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
        id: "algorithm-shorts",
        featureId: "algorithm-shorts",
        to: "/algorithms/short",
        icon: Home,
        label: { en: "Algorithm Shorts", vi: "Short thuật toán" },
        matchPaths: ["/", "/algorithms/short"],
      },
      {
        id: "maze-pathfinding",
        featureId: "maze-pathfinding",
        to: "/algorithms/maze",
        icon: Map,
        label: { en: "Maze Pathfinding", vi: "Tìm đường mê cung" },
        matchPaths: ["/algorithms/maze", "/maze-pathfinding", "/algorithm-world"],
      },
      {
        id: "algorithm-long",
        featureId: "algorithm-long",
        to: "/algorithms/video-long",
        icon: Video,
        label: { en: "Algorithm Long", vi: "Video thuật toán dài" },
        matchPaths: ["/algorithms/video-long", "/long-content"],
      },
    ],
  },
  {
    id: "story-production",
    label: { en: "Story Studio", vi: "Truyện" },
    items: [
      {
        id: "story-video",
        featureId: "story-video",
        to: "/stories/video",
        icon: Clapperboard,
        label: { en: "Story Video", vi: "Video truyện" },
        matchPaths: ["/stories/video", "/story-video"],
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
        matchPaths: ["/stories/review", "/story-review"],
      },
    ],
  },
  {
    id: "channels-publishing",
    label: { en: "Football news studio", vi: "Studio tin bóng đá" },
    items: [
      {
        id: "mu-news",
        featureId: "mu-news",
        to: "/football/mu-news",
        icon: Newspaper,
        label: { en: "MU News", vi: "Tin tức MU" },
        matchPaths: ["/football/mu-news", "/mu-news"],
      },
    ],
  },
  {
    id: "common-tools",
    label: { en: "Common tools", vi: "Công cụ chung" },
    items: [
      {
        id: "ai-video-agent",
        to: "/ai-video-agent",
        icon: Bot,
        label: { en: "AI Video Agent", vi: "AI tạo video" },
        matchPaths: ["/ai-video-agent"],
      },
      {
        id: "text-to-speech",
        to: "/text-to-speech",
        icon: MicVocal,
        label: { en: "Text to Speech", vi: "Text to Speech" },
        matchPaths: ["/text-to-speech"],
      },
      {
        id: "video-create",
        to: "/video-create",
        icon: Film,
        label: { en: "Video Create", vi: "Tạo/chỉnh video" },
        matchPaths: ["/video-create"],
      },
    ],
  },
  {
    id: "manage",
    label: { en: "Manage", vi: "Quản lý" },
    items: [
      {
        id: "channel",
        to: "/channel",
        icon: Youtube,
        label: { en: "Channel Manager", vi: "Quản lý kênh" },
        matchPaths: ["/channel", "/youtube", "/youtube-publishing", "/social-publishing"],
      },
      {
        id: "assets",
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
