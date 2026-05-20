import { useEffect, useRef, useState } from "react";
import { audioEngine, type SfxKind } from "@/lib/audio";
import type { Lang } from "@/lib/i18n";
import { getKineticTypographySlideKey } from "@/lib/kineticTypographyRenderer";
import { getSceneAtTime, type LongContentScene } from "@/lib/longContentTimeline";
import type { LongVideoType } from "@/lib/longVideoTypes";
import { getAssetSfxOption } from "@/lib/selectSounds";

type Params = {
  algoId: string;
  lang: Lang;
  scenes: LongContentScene[];
  elapsedSec: number;
  playing: boolean;
  exporting: boolean;
  longVideoType: LongVideoType;
};

export function useKineticSlideSfx(params: Params) {
  const lastKey = useRef<string | null>(null);
  const [kineticSlideSfx, setKineticSlideSfx] = useState<SfxKind>("marimba");
  const [sfxVol, setSfxVol] = useState(60);

  useEffect(() => { audioEngine.setSfxVolume(sfxVol / 100); }, [sfxVol]);
  useEffect(() => {
    const option = getAssetSfxOption(kineticSlideSfx);
    if (option) void option.loadUrl().then((url) => audioEngine.loadAssetSfx(option.id, url)).catch(() => undefined);
  }, [kineticSlideSfx]);
  useEffect(() => {
    if (!params.playing || params.exporting || params.longVideoType !== "kinetic-typography") return;
    playKineticSlideSfxAt(params.elapsedSec);
  }, [params.playing, params.exporting, params.elapsedSec, params.longVideoType, kineticSlideSfx]);

  function resetKineticSlideSfx() {
    lastKey.current = null;
  }

  function playKineticSlideSfxAt(timeSec: number) {
    const key = getKineticSlideKeyAt(timeSec);
    if (!key || key === lastKey.current) return;
    lastKey.current = key;
    audioEngine.playSfx(kineticSlideSfx, 0.72);
  }

  function getKineticSlideKeyAt(timeSec: number) {
    const state = getSceneAtTime(params.scenes, timeSec);
    return getKineticTypographySlideKey({
      algoId: params.algoId,
      sceneId: state.scene.id,
      sceneProgress: state.progress,
      lang: params.lang,
      sceneText: [state.scene.title, state.scene.subtitle, ...state.scene.bullets].join(" "),
    });
  }

  return { kineticSlideSfx, setKineticSlideSfx, sfxVol, setSfxVol, playKineticSlideSfxAt, resetKineticSlideSfx };
}
