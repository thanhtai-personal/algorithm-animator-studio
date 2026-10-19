import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MathIntro } from "../MathIntro";

const render = (frame: number) => renderToStaticMarkup(<svg><MathIntro frame={frame}/></svg>);

describe("reference-aligned sin/cos intro", () => {
  it("starts with a person, but without premature captions or quiz", () => {
    const markup = render(0);
    expect(markup).toContain('translate(148,602)');
    expect(markup).not.toContain('sin = đối / huyền');
    expect(markup).not.toContain('Đề kiểm tra');
    expect(markup).not.toContain('M 346 487');
  });
  it("shows full-size right triangle with sin and cos labels at 10 seconds", () => {
    const markup = render(250);
    expect(markup).toContain('M 346 487 L 667.00 302.00 L 667 487 Z');
    expect(markup).toContain('sin = đối / huyền');
    expect(markup).toContain('cos = kề / huyền');
    expect(markup).not.toContain('sin 120° = ?');
  });
  it("moves triangle peak to reference obtuse-angle position at 18 seconds", () => {
    const markup = render(450);
    expect(markup).toContain('M 346 487 L 162.00 167.00 L 667 487 Z');
    expect(markup).toContain('120°');
    expect(markup).toContain('sin 120° = ?');
  });
  it("adds angle segments during the 20–24 second explanation", () => {
    const markup = render(550);
    expect(markup).toContain('M 667 487 L 720 487');
    expect(markup).toContain('M 346 487 L 321 438');
  });
  it("switches to reference angle axis at 34 seconds", () => {
    const markup = render(850);
    expect(markup).toContain('M 145 534 H 1134');
    expect(markup).toContain('180°');
    expect(markup).toMatch(/translate\\(50[0-9]/);
    expect(markup).not.toContain('sin 120° = ?');
  });
});
