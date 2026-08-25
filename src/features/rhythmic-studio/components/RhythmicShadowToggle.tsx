import { SunDim, SunMedium } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Lang } from "@/lib/i18n";

export function RhythmicShadowToggle({ enabled, disabled = false, lang, onChange }: {
  enabled: boolean;
  disabled?: boolean;
  lang: Lang;
  onChange: (enabled: boolean) => void;
}) {
  const label = lang === "vi" ? "Bóng nhạc cụ" : "Instrument shadows";
  const state = lang === "vi" ? (enabled ? "Bật" : "Tắt") : (enabled ? "On" : "Off");
  const Icon = enabled ? SunMedium : SunDim;
  return (
    <Button
      type="button"
      size="sm"
      variant={enabled ? "secondary" : "ghost"}
      disabled={disabled}
      aria-label={`${label}: ${state}`}
      aria-pressed={enabled}
      title={`${label}: ${state}`}
      onClick={() => onChange(!enabled)}
      className="h-8 gap-1.5"
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{lang === "vi" ? "Bóng" : "Shadows"}</span>
      <span className="text-[10px] font-normal text-muted-foreground">{state}</span>
    </Button>
  );
}
