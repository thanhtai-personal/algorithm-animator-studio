import { useState } from "react";
import { ChevronsLeft, ChevronsRight, Eye, PlugZap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { t, type Lang } from "@/lib/i18n";
import {
  MENU_FEATURE_LABELS,
  type MenuFeatureId,
  type MenuFeatureSettings,
} from "@/lib/menuFeatureSettings";
import { SettingsProvidersTab } from "./SettingsProvidersTab";

const FEATURE_GROUPS: Array<{
  title: Record<Lang, string>;
  items: MenuFeatureId[];
}> = [
  {
    title: { en: "Algorithm channel screens", vi: "Màn hình kênh thuật toán" },
    items: ["algorithm-studio", "rhythmic-studio", "maze-pathfinding", "algorithm-long"],
  },
  {
    title: { en: "News channel screens", vi: "Màn hình kênh tin tức" },
    items: ["github-trending", "football-commentary"],
  },
  {
    title: { en: "Story channel screens", vi: "Màn hình kênh truyện" },
    items: ["story-studio", "story-author", "story-review"],
  },
  {
    title: { en: "Common video screens", vi: "Màn hình video chung" },
    items: ["common-video", "text-to-speech", "youtube-tools"],
  },
  {
    title: { en: "Management screens", vi: "Màn hình quản lý" },
    items: ["jobs", "channel", "assets"],
  },
];

type ToolsSection = "screens" | "providers";

const TOOLS_SECTIONS: { id: ToolsSection; label: Record<Lang, string>; icon: typeof Eye }[] = [
  { id: "screens", label: { en: "Screens", vi: "Màn hình" }, icon: Eye },
  { id: "providers", label: { en: "Providers", vi: "Provider" }, icon: PlugZap },
];

type SettingsModulesTabProps = {
  lang: Lang;
  settings: MenuFeatureSettings;
  onChange: (next: MenuFeatureSettings) => void;
};

export function SettingsModulesTab({ lang, settings, onChange }: SettingsModulesTabProps) {
  const [activeSection, setActiveSection] = useState<ToolsSection>("screens");
  const [menuCollapsed, setMenuCollapsed] = useState(false);

  function updateFeature(id: MenuFeatureId, enabled: boolean) {
    onChange({ ...settings, [id]: enabled });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(lang, "uiModules")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)]">
          <aside className={`rounded-lg border border-border bg-muted/30 p-2 transition-[width] duration-200 ${menuCollapsed ? "w-[68px]" : "w-full lg:w-56"}`}>
            <div className="mb-2 flex items-center justify-between gap-2">
              {!menuCollapsed ? <span className="px-2 text-xs font-semibold text-muted-foreground">{t(lang, "uiModules")}</span> : null}
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setMenuCollapsed((value) => !value)}>
                {menuCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
              </Button>
            </div>
            <nav className="grid gap-1" aria-label={t(lang, "uiModuleSettings")}>
              {TOOLS_SECTIONS.map((section) => {
                const Icon = section.icon;
                const selected = activeSection === section.id;
                const label = section.label[lang];
                return (
                  <button
                    key={section.id}
                    type="button"
                    className={[
                      "flex h-10 items-center gap-2 rounded-md px-2 text-sm font-medium transition-colors",
                      selected ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
                      menuCollapsed ? "justify-center" : "justify-start",
                    ].join(" ")}
                    title={label}
                    aria-current={selected ? "page" : undefined}
                    onClick={() => setActiveSection(section.id)}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {menuCollapsed ? <span className="sr-only">{label}</span> : <span>{label}</span>}
                  </button>
                );
              })}
            </nav>
          </aside>

          <div className="min-w-0">
            {activeSection === "screens" ? (
              <section className="space-y-6">
                <h3 className="text-lg font-semibold">{t(lang, "uiScreenVisibility")}</h3>
                {FEATURE_GROUPS.map((group) => (
                  <section key={group.title.en} className="space-y-3 rounded-xl border border-border/70 p-4">
                    <div>
                      <h4 className="font-semibold">{group.title[lang]}</h4>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {group.items.map((id) => {
                        const label = MENU_FEATURE_LABELS[id];
                        return (
                          <div key={id} className="flex items-start justify-between gap-4 rounded-lg border bg-card/40 p-3">
                            <div className="min-w-0">
                              <Label htmlFor={`menu-feature-${id}`} className="font-medium">
                                {label[lang]}
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
              </section>
            ) : null}

            {activeSection === "providers" ? <SettingsProvidersTab lang={lang} /> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
