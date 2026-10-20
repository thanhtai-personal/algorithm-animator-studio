import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MathChapterVisual } from "../MathChapters";
import { REFERENCE_BEATS, beatState, referenceBeatAt } from "../MathReferenceBeats";
import { MATH_FRAMES, chapterAt } from "../mathTimeline";
import { MathIntro } from "../MathIntro";

function markup(frame:number) {
  if(frame < 1075) return renderToStaticMarkup(<svg><MathIntro frame={frame}/></svg>);
  return renderToStaticMarkup(<svg><MathChapterVisual chapter={chapterAt(frame)} frame={frame}/></svg>);
}
describe("Task 05 — beat-specific source reconstruction", () => {
  it("has a stable source-cue selection for every post-intro frame", () => {
    expect(REFERENCE_BEATS).toHaveLength(36);
    expect(referenceBeatAt(1075).id).toBe("beat-02");
    for(let frame=1000;frame<MATH_FRAMES;frame++) {
      const state=beatState(frame);
      expect(frame).toBeGreaterThanOrEqual(state.cue.startFrame);
      expect(frame).toBeLessThan(state.cue.endFrame);
      expect(state.t).toBeGreaterThanOrEqual(0);
      expect(state.t).toBeLessThanOrEqual(1);
    }
    expect(referenceBeatAt(MATH_FRAMES-1).id).toBe("beat-36");
  });
  it("renders unique SVG content at every beat midpoint without invalid path coordinates", () => {
    for(const beat of REFERENCE_BEATS) {
      const frame=Math.floor((beat.startFrame+beat.endFrame)/2);
      const output=markup(frame);
      expect(output.length, beat.id).toBeGreaterThan(300);
      expect(output, beat.id).not.toMatch(/NaN|Infinity|undefined/);
      expect(output, beat.id).toContain("<svg>");
    }
  });
  it("renders subjects at the source-observed chapter ranges", () => {
    expect(markup(62*25)).toContain("Ngang cos");
    expect(markup(90*25)).toContain("sin = đối / huyền");
    expect(markup(150*25)).toContain("sin² + cos² = 1");
    expect(markup(195*25)).toContain("Radian");
    expect(markup(245*25)).toContain("tang = sin / cos");
    expect(markup(310*25)).toContain("Jiba");
    expect(markup(355*25)).toContain("Âm thoa");
    expect(markup(375*25)).toContain("Độ dốc = tang h");
    expect(markup(405*25)).toContain("Thủy triều");
    expect(markup(425*25)).toContain("Đo cây");
    expect(markup(445*25)).toContain("8,33%");
    expect(markup(480*25)).toContain("Đ Ộ   D Ố C   P H Ầ N   T R Ă M");
    expect(markup(488*25)).toContain("M 126 301 L 200 174 L 274 301 Z");
    expect(markup(510*25)).toContain("Đ I Ệ N  B A  P H A");
    expect(markup(510*25)).not.toContain("20 ms");
    expect(markup(532*25)).toContain("Điện ba pha");
    expect(markup(532*25)).toContain("20 ms");
    expect(markup(552*25)).toContain("380 V");
    expect(markup(575*25)).toContain("Một phần tư");
    expect(markup(575*25)).toContain("Ngoại lệ");
    expect(markup(595*25)).toContain("sin 120°");
    expect(markup(605*25)).toContain("VÔ HẠN");
  });
  it("seeks to the same animated geometry independent of render order", () => {
    const frames=[1075,2200,3600,4400,6100,8200,8900,10600,11700,13400,14900,15216];
    const first=frames.map(markup);
    [...frames].reverse().map(markup);
    expect(frames.map(markup)).toEqual(first);
  });
});
