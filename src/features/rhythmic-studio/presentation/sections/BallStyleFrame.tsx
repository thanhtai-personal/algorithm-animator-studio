import { CircleDot } from "lucide-react";
import { useSystemLang } from "@/hooks/use-system-lang";
import { ballStyleText } from "../../ballStyleI18n";
import { rhythmicText } from "../../i18n";
import { BALL_STYLES } from "../../types";
import { MARBLE_AVATARS, marbleAvatarText } from "../../lib/marbleAvatars";
import type { RhythmicStudioController } from "../../hooks/useRhythmicStudioController";
import { ControlFrame } from "../atoms/ControlFrame";
import { PreviewChoiceGrid } from "../atoms/PreviewChoiceGrid";
import { BallStylePreview, MarbleAvatarPreview } from "../atoms/RhythmicOptionPreviews";

export function BallStyleFrame({ studio }: { studio: RhythmicStudioController }) {
  const lang = useSystemLang();
  const options = BALL_STYLES.map((value) => ({
    value,
    label: ballStyleText(lang, value),
    preview: <BallStylePreview style={value} />,
  }));
  const avatarOptions = MARBLE_AVATARS.map((value) => ({
    value,
    label: marbleAvatarText(lang, value),
    preview: <MarbleAvatarPreview avatar={value} ballStyle={studio.settings.ballStyle} />,
  }));
  const is2D = studio.rendererMode === "legacy";

  return <ControlFrame
    title={rhythmicText(lang, "visual.ballStyle")}
    icon={<CircleDot className="h-4 w-4 text-cyan-300" />}
  >
    {is2D ? <PreviewChoiceGrid
      label={lang === "vi" ? "Bi hoặc nhân vật" : "Marble or character"}
      value={studio.settings.marbleAvatar}
      options={avatarOptions}
      columns="grid-cols-2"
      className="max-h-[28rem] overflow-y-auto pr-1"
      onChange={(value) => studio.patch("marbleAvatar", value as typeof studio.settings.marbleAvatar)}
    /> : null}
    {!is2D || studio.settings.marbleAvatar === "ball" ? <div className={is2D ? "pt-2" : undefined}>
    <PreviewChoiceGrid
      label={lang === "vi" ? (is2D ? "Kiểu bi" : "Kiểu bi 3D") : (is2D ? "Marble material" : "3D marble material")}
      value={studio.settings.ballStyle}
      options={options}
      columns="grid-cols-2"
      onChange={(value) => studio.patch("ballStyle", value as typeof studio.settings.ballStyle)}
    />
    </div> : null}
  </ControlFrame>;
}
