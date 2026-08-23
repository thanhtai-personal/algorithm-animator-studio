import { Move3d } from "lucide-react";
import { useSystemLang } from "@/hooks/use-system-lang";
import { rhythmicText, type RhythmicTextKey } from "../../i18n";
import type { RhythmicStudioController } from "../../hooks/useRhythmicStudioController";
import type { StudioSettings } from "../../types";
import { ControlFrame } from "../atoms/ControlFrame";
import { RangeField, SelectField } from "../atoms/ControlFields";

export function MotionFrame({ studio }: { studio: RhythmicStudioController }) {
  const lang = useSystemLang();
  const t = (key: RhythmicTextKey) => rhythmicText(lang, key);
  const options = (["none", "ease-in", "ease-out", "pulse"] as const).map((value) => ({ value, label: t(`acceleration.${value}` as RhythmicTextKey) }));
  const s = studio.settings;
  return <ControlFrame title={t("section.motion")} icon={<Move3d className="h-4 w-4 text-primary" />}>
    <RangeField label={t("motion.bounceHeight")} value={s.bounceHeight} min={45} max={260} step={5} unit="px" onChange={(value) => studio.patch("bounceHeight", value)} />
    <RangeField label={t("motion.arcCurve")} value={s.curveIntensity} min={0} max={1.2} step={0.02} onChange={(value) => studio.patch("curveIntensity", value)} />
    <RangeField label={t("motion.cameraAnchor")} value={s.cameraAnchor} min={0.2} max={0.55} step={0.01} onChange={(value) => studio.patch("cameraAnchor", value)} />
    <RangeField label={t("motion.cameraFollow")} value={s.cameraSmoothing} min={0.03} max={0.65} step={0.01} onChange={(value) => studio.patch("cameraSmoothing", value)} />
    <SelectField label={t("motion.accelerationMode")} value={s.accelerationMode} options={options} onChange={(value) => studio.patch("accelerationMode", value as StudioSettings["accelerationMode"])} />
    <RangeField label={t("motion.accelerationFactor")} value={s.accelerationFactor} min={0.5} max={2.5} step={0.05} onChange={(value) => studio.patch("accelerationFactor", value)} />
  </ControlFrame>;
}
