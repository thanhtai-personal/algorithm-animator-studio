import { Mountain } from "lucide-react";
import { useSystemLang } from "@/hooks/use-system-lang";
import { rhythmicText, type RhythmicTextKey } from "../../i18n";
import { layoutText } from "../../layoutI18n";
import { PLATFORM_STYLES, type StudioSettings } from "../../types";
import type { RhythmicStudioController } from "../../hooks/useRhythmicStudioController";
import { ControlFrame } from "../atoms/ControlFrame";
import { RangeField, SelectField, ToggleField } from "../atoms/ControlFields";

export function TerrainFrame({ studio }: { studio: RhythmicStudioController }) {
  const lang = useSystemLang();
  const t = (key: RhythmicTextKey) => rhythmicText(lang, key);
  const platformLabel = (value: string) => value.startsWith("glass-") && value !== "glass" ? layoutText(lang, `platform.${value}` as Parameters<typeof layoutText>[1]) : t(`platformStyle.${value}` as RhythmicTextKey);
  const platformOptions = PLATFORM_STYLES.map((value) => ({ value, label: platformLabel(value) }));
  const mixOptions = (["single", "alternate", "accent", "shuffle"] as const).map((value) => ({ value, label: t(`platformMix.${value}` as RhythmicTextKey) }));
  const s = studio.settings;
  return <ControlFrame title={layoutText(lang, "tabs.terrain")} subtitle={`${studio.timeline.length} ${t("canvas.beats")}`} icon={<Mountain className="h-4 w-4 text-primary" />} defaultOpen={false}>
    <SelectField label={t("course.platformMix")} value={s.platformMixMode} options={mixOptions} onChange={(value) => studio.patch("platformMixMode", value as StudioSettings["platformMixMode"])} />
    <SelectField label={t("course.primaryStyle")} value={s.platformPrimaryStyle} options={platformOptions} onChange={(value) => studio.patch("platformPrimaryStyle", value as StudioSettings["platformPrimaryStyle"])} />
    <SelectField label={t("course.secondaryStyle")} value={s.platformSecondaryStyle} options={platformOptions} onChange={(value) => studio.patch("platformSecondaryStyle", value as StudioSettings["platformSecondaryStyle"])} />
    <RangeField label={t("course.platformWidth")} value={s.platformWidth} min={50} max={420} step={4} unit="px" onChange={(value) => studio.patch("platformWidth", value)} />
    <RangeField label={t("course.platformThickness")} value={s.platformThickness} min={8} max={34} step={1} unit="px" onChange={(value) => studio.patch("platformThickness", value)} />
    <RangeField label={t("course.verticalGap")} value={s.platformGap} min={70} max={300} step={5} unit="px" onChange={(value) => studio.patch("platformGap", value)} />
    <RangeField label={t("course.laneSpread")} value={s.laneSpread} min={80} max={600} step={5} unit="px" onChange={(value) => studio.patch("laneSpread", value)} />
    <RangeField label={t("course.minJump")} value={s.minBounceDistance} min={8} max={160} step={2} unit="px" onChange={(value) => studio.patch("minBounceDistance", value)} />
    <RangeField label={t("course.platformTilt")} value={s.platformTilt} min={0} max={90} step={1} unit="°" onChange={(value) => studio.patch("platformTilt", value)} />
    <RangeField label={t("course.platformGlow")} value={s.platformGlow} min={0} max={1.5} step={0.05} onChange={(value) => studio.patch("platformGlow", value)} />
    <ToggleField label={t("course.impactRipple")} checked={s.impactRipple} onChange={(value) => studio.patch("impactRipple", value)} />
  </ControlFrame>;
}
