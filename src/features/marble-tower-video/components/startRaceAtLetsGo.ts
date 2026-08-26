import type { AudioSourceMeta, StudioSettings } from "@/features/rhythmic-studio/types";

type PatchSettings = <K extends keyof StudioSettings>(key: K, value: StudioSettings[K]) => void;

export function startRaceAtLetsGo({
  sourceType,
  patch,
  playCue,
  startPlaybackAudio,
  releaseStart,
}: {
  sourceType: AudioSourceMeta["type"];
  patch: PatchSettings;
  playCue: () => Promise<void>;
  startPlaybackAudio: (resumeMs?: number) => Promise<void>;
  releaseStart: () => unknown;
}) {
  if (sourceType === "midi") patch("midiPlaybackEnabled", true);
  if (sourceType === "audio") patch("playOriginalSong", true);

  try { void playCue().catch(() => undefined); } catch { /* optional voice cue */ }
  try { void startPlaybackAudio(0).catch(() => undefined); } catch { /* browser audio may be blocked */ }

  // Never await audio decoding, autoplay, or the full voice clip here. Waiting
  // left the recorded canvas motionless while its audio timeline had started.
  releaseStart();
}
