import { ImageIcon } from "lucide-react";
import { useSystemLang } from "@/hooks/use-system-lang";
import type { RhythmicStudioController } from "../../hooks/useRhythmicStudioController";
import { mediaText, type MediaTextKey } from "../../mediaI18n";
import { BACKGROUND_PRESETS, type StudioSettings } from "../../types";
import { ControlFrame } from "../atoms/ControlFrame";
import { PreviewChoiceGrid } from "../atoms/PreviewChoiceGrid";
import { BackgroundPresetPreview } from "../atoms/RhythmicOptionPreviews";

export function BackgroundStyleFrame({ studio }: { studio: RhythmicStudioController }) {
  const lang = useSystemLang();
  const options = BACKGROUND_PRESETS.map((value) => ({
    value,
    label: mediaText(lang, `background.${value}` as MediaTextKey),
    preview: <BackgroundPresetPreview preset={value} />,
  }));

  return <ControlFrame
    title={mediaText(lang, "background.preset")}
    icon={<ImageIcon className="h-4 w-4 text-cyan-300" />}
  >
    <PreviewChoiceGrid
      value={studio.settings.backgroundPreset}
      options={options}
      columns="grid-cols-2"
      onChange={(value) => studio.patch("backgroundPreset", value as StudioSettings["backgroundPreset"])}
    />
  </ControlFrame>;
}
