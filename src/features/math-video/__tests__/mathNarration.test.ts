import { describe,expect,it } from "vitest";
import { MATH_NARRATION_CUES, voiceDurationSeconds } from "../mathNarrationCues";
import { buildNarrationFilterGraph } from "../mathNarrationMixPlan";
import { MATH_FPS, MATH_FRAMES } from "../mathTimeline";
import { REFERENCE_BEATS } from "../MathReferenceBeats";

describe("Task 06 — editable author-written narration",()=>{
  it("spans 37 sequential cue windows with no gap in a 25fps 10:09 movie",()=>{
    expect(MATH_NARRATION_CUES).toHaveLength(37);
    expect(MATH_NARRATION_CUES[0].id).toBe("intro-00");
    let next=0;
    for(const cue of MATH_NARRATION_CUES){
      expect(cue.startFrame).toBe(next);
      expect(cue.endFrame).toBeGreaterThan(cue.startFrame);
      expect(cue.draftText.trim().length).toBeGreaterThan(20);
      expect(cue.timingVerified).toBe(false);
      expect(voiceDurationSeconds(cue)).toBeCloseTo((cue.endFrame-cue.startFrame)/MATH_FPS);
      next=cue.endFrame;
    }
    expect(next).toBe(MATH_FRAMES);
    for(const [i,source] of REFERENCE_BEATS.entries()){
      const c=MATH_NARRATION_CUES[i+1];
      expect([c.id,c.startFrame,c.endFrame]).toEqual([source.id,source.startFrame,source.endFrame]);
    }
  });
  it("places each generated voice input on an exact 40ms frame boundary",()=>{
    const cue=MATH_NARRATION_CUES[4]; // beat-04
    const graph=buildNarrationFilterGraph([cue]);
    expect(graph).toContain("adelay=67200:all=1");
    expect(graph).toContain("atrim=duration=23.600");
    expect(graph).toContain("amix=inputs=1");
    expect(graph).toContain("atrim=duration=608.680");
    expect(graph).toContain("aresample=48000");
  });
  it("caps independent cues and maps input IDs in order without overlap or audio re-use",()=>{
    const chosen=[MATH_NARRATION_CUES[0],MATH_NARRATION_CUES[2],MATH_NARRATION_CUES[36]];
    const graph=buildNarrationFilterGraph(chosen);
    for(const [i,cue] of chosen.entries()){
      expect(graph).toContain(`[${i}:a:0]atrim=duration=${voiceDurationSeconds(cue).toFixed(3)}`);
      expect(graph).toContain(`adelay=${cue.startFrame*1000/25}:all=1[a${i}]`);
    }
    expect(graph).toContain("[a0][a1][a2]amix=inputs=3");
    expect(graph).not.toContain("FDown.vn");
  });
  it("rejects invalid audio frame ranges rather than allowing drift",()=>{
    expect(()=>buildNarrationFilterGraph([])).toThrow();
    expect(()=>buildNarrationFilterGraph([{startFrame:-1,endFrame:100}])).toThrow();
    expect(()=>buildNarrationFilterGraph([{startFrame:500,endFrame:400}])).toThrow();
    expect(()=>buildNarrationFilterGraph([{startFrame:100,endFrame:MATH_FRAMES+1}])).toThrow();
    expect(()=>buildNarrationFilterGraph([{startFrame:100.5,endFrame:200}])).toThrow();
  });
});
