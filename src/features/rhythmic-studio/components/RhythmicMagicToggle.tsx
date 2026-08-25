import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Lang } from "@/lib/i18n";

export function RhythmicMagicToggle({
  enabled,
  available = true,
  disabled = false,
  lang,
  onChange,
}: {
  enabled: boolean;
  available?: boolean;
  disabled?: boolean;
  lang: Lang;
  onChange: (enabled: boolean) => void;
}) {
  const state = !available
    ? (lang === "vi" ? "Không có" : "Unavailable")
    : enabled
      ? (lang === "vi" ? "Bật" : "On")
      : (lang === "vi" ? "Tắt" : "Off");
  const name = lang === "vi" ? `Magic 3D: ${state}` : `3D Magic: ${state}`;

  return (
    <Button
      type="button"
      size="sm"
      variant={available && enabled ? "secondary" : "outline"}
      disabled={disabled || !available}
      aria-label={name}
      aria-pressed={available ? enabled : undefined}
      title={name}
      onClick={() => onChange(!enabled)}
      className="h-8"
    >
      <Sparkles className="mr-1.5 h-3.5 w-3.5" />Magic
    </Button>
  );
}
