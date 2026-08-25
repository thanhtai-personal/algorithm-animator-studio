import { CircleDot } from "lucide-react";
import { useSystemLang } from "@/hooks/use-system-lang";
import { ballStyleText } from "../../ballStyleI18n";
import { rhythmicText } from "../../i18n";
import { BALL_STYLES } from "../../types";
import type { RhythmicStudioController } from "../../hooks/useRhythmicStudioController";
import { ControlFrame } from "../atoms/ControlFrame";
import { PreviewChoiceGrid } from "../atoms/PreviewChoiceGrid";
import { BallStylePreview } from "../atoms/RhythmicOptionPreviews";

export function BallStyleFrame({ studio }: { studio: RhythmicStudioController }) {
  const lang = useSystemLang();
  const options = BALL_STYLES.map((value) => ({
    value,
    label: ballStyleText(lang, value),
    preview: <BallStylePreview style={value} />,
  }));

  return <ControlFrame
    title={rhythmicText(lang, "visual.ballStyle")}
    icon={<CircleDot className="h-4 w-4 text-cyan-300" />}
  >
    <PreviewChoiceGrid
      value={studio.settings.ballStyle}
      options={options}
      columns="grid-cols-2"
      onChange={(value) => studio.patch("ballStyle", value as typeof studio.settings.ballStyle)}
    />
  </ControlFrame>;
}
