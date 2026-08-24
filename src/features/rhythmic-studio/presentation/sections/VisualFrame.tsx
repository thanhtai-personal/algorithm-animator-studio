import { Sparkles } from "lucide-react";
import { useSystemLang } from "@/hooks/use-system-lang";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { rhythmicText, type RhythmicTextKey } from "../../i18n";
import { BALL_STYLES } from "../../types";
import { ballStyleText } from "../../ballStyleI18n";
import type { RhythmicStudioController } from "../../hooks/useRhythmicStudioController";
import { ControlFrame } from "../atoms/ControlFrame";
import { BallStylePreview } from "../atoms/RhythmicOptionPreviews";
import { ColorField, RangeField, ToggleField } from "../atoms/ControlFields";
import { PreviewChoiceGrid } from "../atoms/PreviewChoiceGrid";

export function VisualFrame({ studio }: { studio: RhythmicStudioController }) {
  const lang = useSystemLang();
  const t = (key: RhythmicTextKey) => rhythmicText(lang, key);
  const ballOptions = BALL_STYLES.map((value) => ({
    value,
    label: ballStyleText(lang, value),
    preview: <BallStylePreview style={value} />,
  }));
  const s = studio.settings;
  return <ControlFrame title={t("section.visual")} icon={<Sparkles className="h-4 w-4 text-primary" />} defaultOpen={false}>
    <div className="space-y-2"><Label className="text-xs text-muted-foreground">{t("visual.titleText")}</Label><Input value={s.titleText} maxLength={64} placeholder="MARBLE MUSIC" onChange={(event) => studio.patch("titleText", event.target.value)} /><p className="text-[11px] text-muted-foreground">{t("visual.titleTextHint")}</p></div>
    <PreviewChoiceGrid label={t("visual.ballStyle")} value={s.ballStyle} options={ballOptions} columns="grid-cols-2" onChange={(value) => studio.patch("ballStyle", value as typeof s.ballStyle)} />
    <ColorField label={t("visual.marbleBaseColor")} value={s.ballBaseColor} onChange={(value) => studio.patch("ballBaseColor", value)} />
    <ColorField label={t("visual.marbleAccentColor")} value={s.ballStripeColor} onChange={(value) => studio.patch("ballStripeColor", value)} />
    <RangeField label={t("visual.marbleSize")} value={s.ballSize} min={6} max={28} step={1} unit="px" onChange={(value) => studio.patch("ballSize", value)} />
    <ToggleField label={t("visual.marbleGlow")} checked={s.glowAnimation} onChange={(value) => studio.patch("glowAnimation", value)} />
    <ToggleField label={t("visual.impactPulse")} checked={s.pulseAnimation} onChange={(value) => studio.patch("pulseAnimation", value)} />
    <ToggleField label={t("visual.platformImpactLight")} checked={s.impactPlatformLight} onChange={(value) => studio.patch("impactPlatformLight", value)} />
    <ToggleField label={t("course.impactRipple")} checked={s.impactRipple} onChange={(value) => studio.patch("impactRipple", value)} />
    <RangeField label={t("visual.impactSensitivity")} value={s.animationSensitivity} min={0} max={1.5} step={0.05} onChange={(value) => studio.patch("animationSensitivity", value)} />
    <RangeField label={t("visual.rippleStrength")} value={s.ringPulseSensitivity} min={0} max={1.5} step={0.05} onChange={(value) => studio.patch("ringPulseSensitivity", value)} />
    <RangeField label={t("visual.trailLength")} value={s.trailLength} min={0} max={48} step={1} onChange={(value) => studio.patch("trailLength", value)} />
    <RangeField label={t("visual.collisionParticles")} value={s.particleCount} min={0} max={48} step={1} onChange={(value) => studio.patch("particleCount", value)} />
    <RangeField label={t("visual.particleDensity")} value={s.spectralDensity} min={0} max={1.5} step={0.05} onChange={(value) => studio.patch("spectralDensity", value)} />
    <ColorField label={t("visual.neonStart")} value={s.prismStart} onChange={(value) => studio.patch("prismStart", value)} />
    <ColorField label={t("visual.neonEnd")} value={s.prismEnd} onChange={(value) => studio.patch("prismEnd", value)} />
  </ControlFrame>;
}
