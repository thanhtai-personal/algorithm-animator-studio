import { useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import countOneUrl from "@/assets/marble-count-one.wav?url";
import countThreeUrl from "@/assets/marble-count-three.wav?url";
import countTwoUrl from "@/assets/marble-count-two.wav?url";
import letsGoUrl from "@/assets/marble-lets-go.wav?url";
import type { AudioSourceMeta, StudioSettings } from "@/features/rhythmic-studio/types";
import type { RacePhysics } from "../physics/RacePhysics";
import { raceSessionStore } from "../store/RaceSessionStore";
import { startRaceAtLetsGo } from "./startRaceAtLetsGo";

type PatchSettings = <K extends keyof StudioSettings>(key: K, value: StudioSettings[K]) => void;

const COUNTDOWN_CUES: Record<number, string> = {
  3: countThreeUrl,
  2: countTwoUrl,
  1: countOneUrl,
};

export const RaceStartSequence = observer(function RaceStartSequence({
  active,
  physics,
  sourceType,
  patch,
  playCue,
  startPlaybackAudio,
}: {
  active: boolean;
  physics: RacePhysics | null;
  sourceType: AudioSourceMeta["type"];
  patch: PatchSettings;
  playCue: (url: string) => Promise<void>;
  startPlaybackAudio: (resumeMs?: number) => Promise<void>;
}) {
  const startedPhysicsRef = useRef<RacePhysics | null>(null);
  const spokenRef = useRef<{ physics: RacePhysics | null; countdown: number | null }>({ physics: null, countdown: null });
  const patchRef = useRef(patch);
  const playCueRef = useRef(playCue);
  const startPlaybackAudioRef = useRef(startPlaybackAudio);
  patchRef.current = patch;
  playCueRef.current = playCue;
  startPlaybackAudioRef.current = startPlaybackAudio;

  const phase = raceSessionStore.phase;
  const countdown = raceSessionStore.countdown;

  useEffect(() => {
    if (!active || !physics || phase !== "countdown" || countdown < 1 || countdown > 3) return;
    const spoken = spokenRef.current;
    if (spoken.physics === physics && spoken.countdown === countdown) return;
    spokenRef.current = { physics, countdown };
    void playCueRef.current(COUNTDOWN_CUES[countdown]).catch(() => undefined);
  }, [active, countdown, phase, physics]);

  useEffect(() => {
    if (!active || !physics || phase !== "countdown" || countdown > 0) return;
    if (startedPhysicsRef.current === physics) return;
    startedPhysicsRef.current = physics;
    startRaceAtLetsGo({
      sourceType,
      patch: patchRef.current,
      playCue: () => playCueRef.current(letsGoUrl),
      startPlaybackAudio: startPlaybackAudioRef.current,
      releaseStart: () => physics.releaseStart(),
    });
  }, [active, countdown, phase, physics, sourceType]);

  return null;
});
