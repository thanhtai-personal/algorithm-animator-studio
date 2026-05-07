import type { AppLocale } from "@/constants/locale";

export type GlobalEditorSlotId =
  | "global.hero.badge"
  | "global.hero.heading"
  | "global.hero.subheading"
  | "global.hero.description"
  | "global.map.markers";

export interface GlobalHomepageVisualEditorSlotDefinition {
  id: GlobalEditorSlotId;
  fallbackPosition: {
    topPercent: number;
    leftPercent: number;
  };
  label: Record<AppLocale, string>;
  description: Record<AppLocale, string>;
}

export const GLOBAL_HOMEPAGE_EDITOR_SLOTS: GlobalHomepageVisualEditorSlotDefinition[] = [
  {
    id: "global.hero.badge",
    fallbackPosition: { topPercent: 12, leftPercent: 16 },
    label: { vi: "Hero badge", en: "Hero badge" },
    description: { vi: "Nhãn badge trên hero", en: "Hero badge text" },
  },
  {
    id: "global.hero.heading",
    fallbackPosition: { topPercent: 16, leftPercent: 28 },
    label: { vi: "Hero heading", en: "Hero heading" },
    description: { vi: "Tiêu đề chính hero", en: "Hero heading line" },
  },
  {
    id: "global.hero.subheading",
    fallbackPosition: { topPercent: 20, leftPercent: 42 },
    label: { vi: "Hero subheading", en: "Hero subheading" },
    description: { vi: "Tiêu đề phụ hero", en: "Hero subheading line" },
  },
  {
    id: "global.hero.description",
    fallbackPosition: { topPercent: 27, leftPercent: 28 },
    label: { vi: "SEO description", en: "SEO description" },
    description: { vi: "Mô tả dưới hero", en: "Description below hero" },
  },
  {
    id: "global.map.markers",
    fallbackPosition: { topPercent: 63, leftPercent: 69 },
    label: { vi: "Bản đồ store toàn cục", en: "Global store map" },
    description: { vi: "Marker map và cấu hình branch", en: "Map markers and branch mapping" },
  },
];

export const GLOBAL_HOMEPAGE_EDITOR_COPY = {
  vi: {
    sectionTitle: "Global homepage visual editor",
    sectionHint:
      "Click icon bút chì ngay trên preview để mở right drawer và chỉnh đúng vị trí.",
    nodeListHint: "Lối tắt mở nhanh drawer theo từng slot.",
    drawerFallbackTitle: "Chỉnh sửa homepage chung",
    drawerFallbackDescription:
      "Thay đổi được preview realtime. Nhấn Lưu bên dưới để publish cấu hình.",
    closeAction: "Đóng",
    mapDirtyHint: "Bạn đã thay đổi marker. Nhấn Lưu để publish vị trí mới.",
    fieldLabel: "Nội dung",
  },
  en: {
    sectionTitle: "Global homepage visual editor",
    sectionHint:
      "Click the pencil icon directly on the preview to open the right drawer at that field.",
    nodeListHint: "Quick slot shortcuts to open the drawer.",
    drawerFallbackTitle: "Edit global homepage",
    drawerFallbackDescription:
      "Changes update preview in realtime. Use Save below to publish.",
    closeAction: "Close",
    mapDirtyHint: "Markers changed. Save to publish new positions.",
    fieldLabel: "Content",
  },
} as const;
