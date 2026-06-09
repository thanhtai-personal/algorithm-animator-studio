import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { text, type Lang } from "@/lib/i18n";
import {
  MENU_FEATURE_LABELS,
  type MenuFeatureId,
  type MenuFeatureSettings,
} from "@/lib/menuFeatureSettings";

const FEATURE_GROUPS: Array<{
  titleEn: string;
  titleVi: string;
  descriptionEn: string;
  descriptionVi: string;
  items: MenuFeatureId[];
}> = [
  {
    titleEn: "Algorithm channel screens",
    titleVi: "Màn hình kênh thuật toán",
    descriptionEn: "Enable only the algorithm studios you are actively using.",
    descriptionVi: "Chỉ bật các màn hình sản xuất thuật toán đang dùng.",
    items: ["algorithm-shorts", "maze-pathfinding", "algorithm-long"],
  },
  {
    titleEn: "Story channel screens",
    titleVi: "Màn hình kênh truyện",
    descriptionEn: "Story-specific workflows are hidden by default to keep the studio lean.",
    descriptionVi: "Các workflow riêng cho kênh truyện được tắt mặc định để menu gọn hơn.",
    items: ["story-video", "story-author", "story-review"],
  },
  {
    titleEn: "Publishing/channel screens",
    titleVi: "Màn hình kênh/publishing",
    descriptionEn: "Turn these on only when that channel workflow is configured.",
    descriptionVi: "Chỉ bật khi workflow kênh đó đã được cấu hình.",
    items: ["mu-news", "channel"],
  },
];

type SettingsModulesTabProps = {
  lang: Lang;
  settings: MenuFeatureSettings;
  onChange: (next: MenuFeatureSettings) => void;
};

export function SettingsModulesTab({ lang, settings, onChange }: SettingsModulesTabProps) {
  function updateFeature(id: MenuFeatureId, enabled: boolean) {
    onChange({ ...settings, [id]: enabled });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{text(lang, "Screen visibility", "Ẩn/hiện màn hình")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {text(
              lang,
              "Channel-specific builder screens are hidden by default. System tools like Text to Speech, Video Create, Files, and Settings stay visible.",
              "Các màn hình build kênh cụ thể được tắt mặc định. Công cụ hệ thống như Text to Speech, Tạo/chỉnh video, Quản lý file và Cài đặt vẫn luôn hiển thị.",
            )}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {FEATURE_GROUPS.map((group) => (
            <section key={group.titleEn} className="space-y-3 rounded-xl border border-border/70 p-4">
              <div>
                <h3 className="font-semibold">{text(lang, group.titleEn, group.titleVi)}</h3>
                <p className="text-sm text-muted-foreground">{text(lang, group.descriptionEn, group.descriptionVi)}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {group.items.map((id) => {
                  const label = MENU_FEATURE_LABELS[id];
                  return (
                    <div key={id} className="flex items-start justify-between gap-4 rounded-lg border bg-card/40 p-3">
                      <div className="min-w-0 space-y-1">
                        <Label htmlFor={`menu-feature-${id}`} className="font-medium">
                          {text(lang, label.en, label.vi)}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {text(lang, label.descriptionEn, label.descriptionVi)}
                        </p>
                      </div>
                      <Switch
                        id={`menu-feature-${id}`}
                        checked={settings[id]}
                        onCheckedChange={(checked) => updateFeature(id, checked)}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
