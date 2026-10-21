import { Files, Home, ListChecks, Map, MicVocal, Settings, Video, type LucideIcon } from "lucide-react";
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

export const APP_TITLE = "Algorithm Animator Studio";
export const APP_NAVIGATION_GROUPS: AppNavigationGroup[] = [
  {
    id: "algorithms",
    label: { en: "Algorithms", vi: "Thuật toán" },
    items: [
      { id: "algorithm-studio", featureId: "algorithm-studio", to: "/algorithms", icon: Home, label: { en: "Algorithm Animation", vi: "Video thuật toán" },
        matchPaths: ["/algorithms", "/algorithms/manual", "/algorithms/short", "/algorithms/agentic"] },
      { id: "maze-pathfinding", featureId: "maze-pathfinding", to: "/algorithms/maze", icon: Map, label: { en: "Maze Pathfinding", vi: "Tìm đường mê cung" },
        matchPaths: ["/algorithms/maze", "/algorithms/maze/manual", "/algorithms/maze/agentic"] },
      { id: "algorithm-long", featureId: "algorithm-long", to: "/algorithms/video-long", icon: Video, label: { en: "Algorithm Long Video", vi: "Video thuật toán dài" },
        matchPaths: ["/algorithms/video-long", "/algorithms/video-long/manual", "/algorithms/video-long/agentic"] },
    ],
  },
  {
    id: "voice",
    label: { en: "Voice Tools", vi: "Công cụ giọng nói" },
    items: [
      { id: "text-to-speech", featureId: "text-to-speech", to: "/text-to-speech", icon: MicVocal, label: { en: "Text to Speech", vi: "Chuyển văn bản thành giọng nói" }, matchPaths: ["/text-to-speech"] },
    ],
  },
  {
    id: "workspace",
    label: { en: "Workspace", vi: "Không gian làm việc" },
    items: [
      { id: "assets", featureId: "assets", to: "/assets", icon: Files, label: { en: "Generated Files", vi: "Tệp đã tạo" }, matchPaths: ["/assets"] },
      { id: "jobs", featureId: "jobs", to: "/jobs", icon: ListChecks, label: { en: "Jobs", vi: "Tác vụ" }, matchPaths: ["/jobs"] },
      { id: "settings", to: "/settings", icon: Settings, label: { en: "Settings", vi: "Cài đặt" }, matchPaths: ["/settings"] },
    ],
  },
];
export function filterNavigationGroupsByFeatures(groups: AppNavigationGroup[], settings: MenuFeatureSettings): AppNavigationGroup[] {
  return groups.map((group) => ({
    ...group, items: group.items.filter((item) => !item.featureId || settings[item.featureId]),
  })).filter((group) => group.items.length > 0);
}
export const APP_NAVIGATION: AppNavigationItem[] = APP_NAVIGATION_GROUPS.flatMap((group) => group.items);
export function getActiveNavigationItem(pathname: string) {
  return APP_NAVIGATION.find((item) => item.matchPaths?.some((path) => path === pathname)) ?? APP_NAVIGATION[0];
}
