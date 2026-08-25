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
import { mediaText } from "../../mediaI18n";
import { ChaseBallControls } from "./ChaseBallControls";

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
  const primaryAppearance = {
    ballStyle: studio.settings.ballStyle,
    marbleAvatar: studio.settings.marbleAvatar,
    ballBaseColor: studio.settings.ballBaseColor,
    ballStripeColor: studio.settings.ballStripeColor,
    ballSize: studio.settings.ballSize,
    glowAnimation: studio.settings.glowAnimation,
    pulseAnimation: studio.settings.pulseAnimation,
    impactPlatformLight: studio.settings.impactPlatformLight,
    impactRipple: studio.settings.impactRipple,
    animationSensitivity: studio.settings.animationSensitivity,
    ringPulseSensitivity: studio.settings.ringPulseSensitivity,
    trailLength: studio.settings.trailLength,
    particleCount: studio.settings.particleCount,
    spectralDensity: studio.settings.spectralDensity,
  };

  return <ControlFrame
    title={rhythmicText(lang, "visual.ballStyle")}
    icon={<CircleDot className="h-4 w-4 text-cyan-300" />}
  >
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground">{mediaText(lang, "marble.mode")}</div>
      <div className="grid grid-cols-2 gap-2 rounded-xl border bg-muted/25 p-1">
        {(["single", "chase"] as const).map((mode) => <button
          key={mode}
          type="button"
          aria-pressed={studio.settings.marbleMode === mode}
          onClick={() => studio.patch("marbleMode", mode)}
          className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${studio.settings.marbleMode === mode ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-background"}`}
        >
          {mediaText(lang, mode === "single" ? "marble.mode.single" : "marble.mode.chase")}
        </button>)}
      </div>
    </div>
    {studio.settings.marbleMode === "chase" ? <ChaseBallControls
      lang={lang}
      primary={primaryAppearance}
      secondary={studio.settings.secondaryMarble}
      allowSprites={is2D}
      onPrimaryStyle={(style) => studio.patch("ballStyle", style)}
      onPrimaryAvatar={(avatar) => studio.patch("marbleAvatar", avatar)}
      onSecondaryStyle={studio.store.setSecondaryMarbleStyle}
      onSecondaryAvatar={studio.store.setSecondaryMarbleAvatar}
    /> : <>
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
    </>}
  </ControlFrame>;
}
