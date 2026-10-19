import { MATH_FPS, MATH_FRAMES } from "./mathTimeline";

export type TimedAudioCue = { startFrame:number; endFrame:number };
/**
 * Create lossless-to-timeline FFmpeg audio filter with absolute 40 ms frame ticks.
 * Input ordering matches the FFmpeg -i argument order. Unfilled frames stay silent.
 * Every input is independently capped at its beat end; no cue bleeds into another.
 */
export function buildNarrationFilterGraph(clips:readonly TimedAudioCue[]) {
  if(!clips.length||clips.length>37)throw new Error("Cần từ 1 đến 37 phân cảnh audio.");
  const parts=clips.map((c,i)=>{
    if(!Number.isInteger(c.startFrame)||!Number.isInteger(c.endFrame)
      ||c.startFrame<0||c.endFrame>MATH_FRAMES||c.startFrame>=c.endFrame){
      throw new Error(`Sai khoảng frame của audio ${i}.`);
    }
    const duration=(c.endFrame-c.startFrame)/MATH_FPS;
    const delayMillis=c.startFrame*1000/MATH_FPS; // Exactly integer at 25fps.
    return `[${i}:a:0]atrim=duration=${duration.toFixed(3)},asetpts=PTS-STARTPTS,aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,adelay=${delayMillis}:all=1[a${i}]`;
  });
  const sources=clips.map((_,i)=>`[a${i}]`).join("");
  parts.push(`${sources}amix=inputs=${clips.length}:duration=longest:dropout_transition=0:normalize=0,apad,atrim=duration=${(MATH_FRAMES/MATH_FPS).toFixed(3)},asetpts=PTS-STARTPTS[out]`);
  return parts.join(";");
}
