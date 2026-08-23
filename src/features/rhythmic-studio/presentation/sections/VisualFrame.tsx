import { Sparkles } from "lucide-react";
import { useSystemLang } from "@/hooks/use-system-lang";
import { rhythmicText, type RhythmicTextKey } from "../../i18n";
import { BALL_STYLES, type StudioSettings } from "../../types";
import type { RhythmicStudioController } from "../../hooks/useRhythmicStudioController";
import { ControlFrame } from "../atoms/ControlFrame";
import { ColorField, RangeField, SelectField, ToggleField } from "../atoms/ControlFields";

export function VisualFrame({ studio }: { studio: RhythmicStudioController }) {
  const lang = useSystemLang();
  const t = (key: RhythmicTextKey) => rhythmicText(lang, key);
  const ballOptions = BALL_STYLES.map((value) => ({ value, label: t(`ball.${value}` as RhythmicTextKey) }));
  const s = studio.settings;
  return <ControlFrame title={t("section.visual")} icon={<Sparkles className="h-4 w-4 text-primary" />}>
    <ToggleField label={t("visual.impactPulse")} checked={s.pulseAnimation} onChange={(value) => studio.patch("pulseAnimation", value)} />
    <ToggleField label={t("visual.marbleGlow")} checked={s.glowAnimation} onChange={(value) => studio.patch("glowAnimation", value)} />
    <RangeField label={t("visual.trailLength")} value={s.trailLength} min={0} max={48} step={1} onChange={(value) => studio.patch("trailLength", value)} />
    <RangeField label={t("visual.collisionParticles")} value={s.particleCount} min={0} max={48} step={1} onChange={(value) => studio.patch("particleCount", value)} />
    <RangeField label={t("visual.marbleSize")} value={s.ballSize} min={6} max={28} step={1} unit="px" onChange={(value) => studio.patch("ballSize", value)} />
    <SelectField label={t("visual.ballStyle")} value={s.ballStyle} options={ballOptions} onChange={(value) => studio.patch("ballStyle", value as StudioSettings["ballStyle"])} />
    <ColorField label={t("visual.neonStart")} value={s.prismStart} onChange={(value) => studio.patch("prismStart", value)} />
    <ColorField label={t("visual.neonEnd")} value={s.prismEnd} onChange={(value) => studio.patch("prismEnd", value)} />
  </ControlFrame>;
}
