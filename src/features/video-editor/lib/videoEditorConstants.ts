import type { VideoEditorTransition } from "./videoEditorTypes";

export const VIDEO_EDITOR_TRANSITIONS: Array<{ value: VideoEditorTransition; label: string }> = [
  { value: "blurry", label: "Blurry" },
  { value: "fade", label: "Fade" },
  { value: "zoom-in", label: "Zoom in" },
  { value: "zoom-out", label: "Zoom out" },
  { value: "slide-left", label: "Slide left" },
  { value: "slide-right", label: "Slide right" },
  { value: "slide-up", label: "Slide up" },
  { value: "slide-down", label: "Slide down" },
  { value: "push-left", label: "Push left" },
  { value: "push-right", label: "Push right" },
  { value: "none", label: "None" },
];

export function isVideoEditorTransition(value: unknown): value is VideoEditorTransition {
  return VIDEO_EDITOR_TRANSITIONS.some((transition) => transition.value === value);
}
