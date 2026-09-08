import type { RefObject } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { Card, CardContent } from "@/components/ui/card";
import { SystemLoader } from "@/components/ui/system-loader";
import { PresetVideoComposition } from "../PresetVideoComposition";
import type { PresetVideoCompositionProps } from "../types";
import { PresetPreviewErrorBoundary } from "./PresetVideoControls";

type Props = {
  playerRef: RefObject<PlayerRef>;
  inputProps: PresetVideoCompositionProps;
  durationInFrames: number;
  compositionWidth: number;
  compositionHeight: number;
  fps: number;
  inFrame: number;
  outFrame: number;
  aspectRatio: PresetVideoCompositionProps["aspectRatio"];
  presetId: string;
  preloadingCount: number;
};

export function PresetVideoPreviewStage(props: Props) {
  return (
    <Card className="overflow-hidden bg-black">
      <CardContent className="flex justify-center p-0">
        <div
          className="relative w-full"
          style={{
            maxWidth: getPreviewMaxWidth(props.aspectRatio),
            aspectRatio: `${props.compositionWidth} / ${props.compositionHeight}`,
          }}
        >
          <PresetPreviewErrorBoundary key={`${props.presetId}-${props.aspectRatio}`}>
            <Player
              ref={props.playerRef}
              component={PresetVideoComposition}
              inputProps={props.inputProps}
              durationInFrames={props.durationInFrames}
              compositionWidth={props.compositionWidth}
              compositionHeight={props.compositionHeight}
              fps={props.fps}
              inFrame={props.inFrame}
              outFrame={props.outFrame}
              controls
              style={{ width: "100%", height: "100%", background: "#000" }}
            />
          </PresetPreviewErrorBoundary>

          {props.preloadingCount > 0 ? (
            <div className="pointer-events-none absolute right-2 top-2 flex items-center gap-2 rounded-md bg-black/75 px-2.5 py-1.5 text-[11px] text-white shadow">
              <SystemLoader className="h-3.5 w-3.5" />
              Nạp trước {props.preloadingCount} clip
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function getPreviewMaxWidth(aspectRatio: PresetVideoCompositionProps["aspectRatio"]) {
  if (aspectRatio === "9:16") return "calc(58dvh * 9 / 16)";
  if (aspectRatio === "1:1") return "58dvh";
  return "calc(58dvh * 16 / 9)";
}
