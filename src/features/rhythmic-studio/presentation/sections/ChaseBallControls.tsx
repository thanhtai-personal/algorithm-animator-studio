import type { Lang } from "@/lib/i18n";
import { ballStyleText } from "../../ballStyleI18n";
import { mediaText } from "../../mediaI18n";
import { MARBLE_AVATARS, marbleAvatarText } from "../../lib/marbleAvatars";
import { BALL_STYLES } from "../../types";
import type { BallStyle, MarbleAppearanceSettings, MarbleAvatar } from "../../types";
import { BallStylePreview, MarbleAvatarPreview } from "../atoms/RhythmicOptionPreviews";

interface PerformerControlsProps {
  owner: "a" | "b";
  lang: Lang;
  appearance: MarbleAppearanceSettings;
  allowSprites: boolean;
  onStyle: (style: BallStyle) => void;
  onAvatar: (avatar: MarbleAvatar) => void;
}

const selectClass = "h-9 w-full rounded-lg border border-border bg-background px-2 text-xs font-medium outline-none focus:border-primary";

function PerformerControls(props: PerformerControlsProps) {
  const avatarId = `chase-${props.owner}-avatar`;
  const materialId = `chase-${props.owner}-material`;
  const titleKey = props.owner === "a" ? "marble.a" : "marble.b";
  const avatarKey = props.owner === "a" ? "marble.a.avatar" : "marble.b.avatar";
  const materialKey = props.owner === "a" ? "marble.a.material" : "marble.b.material";
  const preview = props.allowSprites
    ? <MarbleAvatarPreview avatar={props.appearance.marbleAvatar} ballStyle={props.appearance.ballStyle} />
    : <BallStylePreview style={props.appearance.ballStyle} />;

  return <section className="space-y-3 rounded-xl border bg-background/55 p-3">
    <div className="text-xs font-bold uppercase tracking-wide text-foreground">{mediaText(props.lang, titleKey)}</div>
    <div className="overflow-hidden rounded-lg border border-border/60">{preview}</div>
    {props.allowSprites ? <div className="space-y-1.5">
      <label htmlFor={avatarId} className="text-[11px] font-medium text-muted-foreground">{mediaText(props.lang, avatarKey)}</label>
      <select
        id={avatarId}
        className={selectClass}
        value={props.appearance.marbleAvatar}
        onChange={(event) => props.onAvatar(event.target.value as MarbleAvatar)}
      >
        {MARBLE_AVATARS.map((avatar) => <option key={avatar} value={avatar}>{marbleAvatarText(props.lang, avatar)}</option>)}
      </select>
    </div> : null}
    <div className="space-y-1.5">
      <label htmlFor={materialId} className="text-[11px] font-medium text-muted-foreground">{mediaText(props.lang, materialKey)}</label>
      <select
        id={materialId}
        className={selectClass}
        value={props.appearance.ballStyle}
        onChange={(event) => props.onStyle(event.target.value as BallStyle)}
      >
        {BALL_STYLES.map((style) => <option key={style} value={style}>{ballStyleText(props.lang, style)}</option>)}
      </select>
    </div>
  </section>;
}

export function ChaseBallControls({
  lang,
  primary,
  secondary,
  allowSprites,
  onPrimaryStyle,
  onPrimaryAvatar,
  onSecondaryStyle,
  onSecondaryAvatar,
}: {
  lang: Lang;
  primary: MarbleAppearanceSettings;
  secondary: MarbleAppearanceSettings;
  allowSprites: boolean;
  onPrimaryStyle: (style: BallStyle) => void;
  onPrimaryAvatar: (avatar: MarbleAvatar) => void;
  onSecondaryStyle: (style: BallStyle) => void;
  onSecondaryAvatar: (avatar: MarbleAvatar) => void;
}) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
    <PerformerControls owner="a" lang={lang} appearance={primary} allowSprites={allowSprites} onStyle={onPrimaryStyle} onAvatar={onPrimaryAvatar} />
    <PerformerControls owner="b" lang={lang} appearance={secondary} allowSprites={allowSprites} onStyle={onSecondaryStyle} onAvatar={onSecondaryAvatar} />
  </div>;
}
