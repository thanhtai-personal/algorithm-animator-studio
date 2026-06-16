import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { text, type Lang } from "@/lib/i18n";
import {
  MENU_FEATURE_LABELS,
  type MenuFeatureId,
  type MenuFeatureSettings,
} from "@/lib/menuFeatureSettings";
import { SettingsProvidersTab } from "./SettingsProvidersTab";

const FEATURE_GROUPS: Array<{
  titleEn: string;
  titleVi: string;
  items: MenuFeatureId[];
}> = [
  {
    titleEn: "Algorithm channel screens",
    titleVi: "Màn hình kênh thuật toán",
    items: ["algorithm-shorts", "maze-pathfinding", "algorithm-long"],
  },
  {
    titleEn: "Story channel screens",
    titleVi: "Màn hình kênh truyện",
    items: ["story-video", "story-author", "story-review"],
  },
  {
    titleEn: "Publishing screens",
    titleVi: "Màn hình publishing",
    items: ["mu-news"],
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
        </CardHeader>
        <CardContent className="space-y-6">
          {FEATURE_GROUPS.map((group) => (
            <section key={group.titleEn} className="space-y-3 rounded-xl border border-border/70 p-4">
              <div>
                <h3 className="font-semibold">{text(lang, group.titleEn, group.titleVi)}</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {group.items.map((id) => {
                  const label = MENU_FEATURE_LABELS[id];
                  return (
                    <div key={id} className="flex items-start justify-between gap-4 rounded-lg border bg-card/40 p-3">
                      <div className="min-w-0">
                        <Label htmlFor={`menu-feature-${id}`} className="font-medium">
                          {text(lang, label.en, label.vi)}
                        </Label>
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
      <SettingsProvidersTab lang={lang} />
    </div>
  );
}
