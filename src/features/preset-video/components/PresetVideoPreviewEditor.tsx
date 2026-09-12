import { useEffect, useState, type RefObject } from "react";
import type { PlayerRef } from "@remotion/player";
import type { PresetVideoCompositionProps, PresetVideoDefinition, PresetVideoExportSettings } from "../types";
import { PresetVideoPreviewStage } from "./PresetVideoPreviewStage";
import { PresetVideoSectionSelector } from "./PresetVideoSectionSelector";
import { PresetVideoVoiceRecorder } from "./PresetVideoVoiceRecorder";

type Props = {
  preset: PresetVideoDefinition;
  settings: PresetVideoExportSettings;
  inputProps: PresetVideoCompositionProps;
  playerRef: RefObject<PlayerRef>;
  compositionWidth: number;
  compositionHeight: number;
  aspectRatio: PresetVideoCompositionProps["aspectRatio"];
  preloadingCount: number;
  disabled?: boolean;
  onSettingsChange: (patch: Partial<PresetVideoExportSettings>) => void;
};

export function PresetVideoPreviewEditor(props: Props) {
  const firstSectionId = props.preset.previewSections?.[0]?.id || "";
  const [selectedSectionId, setSelectedSectionId] = useState(firstSectionId);

  useEffect(() => {
    setSelectedSectionId(firstSectionId);
  }, [firstSectionId, props.preset.id]);

  const durationInFrames = Math.max(1, Math.round(props.preset.defaultDurationSeconds * props.preset.defaultFps));
  const lastFrame = durationInFrames - 1;
  const inFrame = Math.min(lastFrame, Math.max(0, Math.floor(props.settings.trimStartSeconds * props.preset.defaultFps)));
  const outFrame = Math.min(lastFrame, Math.max(inFrame, Math.ceil(props.settings.trimEndSeconds * props.preset.defaultFps) - 1));

  function selectSection(sectionId: string) {
    setSelectedSectionId(sectionId);
    const section = props.preset.previewSections?.find((item) => item.id === sectionId);
    if (section) {
      props.playerRef.current?.seekTo(Math.min(lastFrame, Math.max(0, Math.floor(section.startSeconds * props.preset.defaultFps))));
    }
  }

  return (
    <>
      {props.preset.previewSections?.length ? (
        <PresetVideoSectionSelector
          sections={props.preset.previewSections}
          selectedId={selectedSectionId}
          disabled={props.disabled}
          onSelect={selectSection}
        />
      ) : null}

      <div className={`grid items-start gap-4 ${props.preset.editableLyrics?.length ? "xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)]" : ""}`}>
        <PresetVideoPreviewStage
          playerRef={props.playerRef}
          inputProps={props.inputProps}
          durationInFrames={durationInFrames}
          compositionWidth={props.compositionWidth}
          compositionHeight={props.compositionHeight}
          fps={props.preset.defaultFps}
          inFrame={inFrame}
          outFrame={outFrame}
          aspectRatio={props.aspectRatio}
          presetId={props.preset.id}
          preloadingCount={props.preloadingCount}
        />
        {props.preset.editableLyrics?.length ? (
          <div className="xl:sticky xl:top-4">
            <PresetVideoVoiceRecorder
              preset={props.preset}
              settings={props.settings}
              playerRef={props.playerRef}
              disabled={props.disabled}
              onSettingsChange={props.onSettingsChange}
            />
          </div>
        ) : null}
      </div>
    </>
  );
}
