import { useMutation } from "@tanstack/react-query";
import { transcodeRhythmicWebmToMp4 } from "../api/rhythmicExportApi";

export function useRhythmicExportMutation() {
  return useMutation({ mutationFn: transcodeRhythmicWebmToMp4 });
}
