import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Lang } from "@/lib/i18n";

export type RhythmicSourceAudioKind = "original" | "midi" | "none";

export function RhythmicOriginalAudioToggle({ kind, enabled, available, disabled = false, lang, onChange }: {
  kind: RhythmicSourceAudioKind;
  enabled: boolean;
  available: boolean;
  disabled?: boolean;
  lang: Lang;
  onChange: (enabled: boolean) => void;
}) {
  const label = kind === "midi"
    ? (lang === "vi" ? "Âm MIDI tổng hợp" : "Synthesized MIDI audio")
    : (lang === "vi" ? "Âm thanh gốc" : "Original audio");
  const shortLabel = kind === "midi"
    ? (lang === "vi" ? "Âm MIDI" : "MIDI audio")
    : (lang === "vi" ? "Âm gốc" : "Original");
  const state = !available
    ? (lang === "vi" ? "Không có" : "Unavailable")
    : lang === "vi"
      ? (enabled ? "Bật" : "Tắt")
      : (enabled ? "On" : "Off");
  const Icon = enabled && available ? Volume2 : VolumeX;

  return (
    <Button
      type="button"
      size="sm"
      variant={enabled && available ? "secondary" : "ghost"}
      disabled={disabled || !available}
      aria-label={`${label}: ${state}`}
      aria-pressed={enabled && available}
      title={`${label}: ${state}`}
      onClick={() => onChange(!enabled)}
      className="h-8 gap-1.5"
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{shortLabel}</span>
      <span className="text-[10px] font-normal text-muted-foreground">{state}</span>
    </Button>
  );
}
