import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BallStylePreview } from "../features/rhythmic-studio/presentation/atoms/RhythmicOptionPreviews";
import { ballStyleText } from "../features/rhythmic-studio/ballStyleI18n";
import { BALL_STYLES, type BallStyle } from "../features/rhythmic-studio/types";

const REFERENCE_BALL_STYLES = ["flower", "fire", "water", "rainbow"] as const satisfies readonly BallStyle[];

describe("reference marble styles", () => {
  it("exposes every collected reference marble in the shared picker", () => {
    for (const style of REFERENCE_BALL_STYLES) {
      expect(BALL_STYLES).toContain(style);
      expect(ballStyleText("en", style)).not.toBe(style);
      expect(ballStyleText("vi", style)).not.toBe(style);
    }
  });

  it.each(REFERENCE_BALL_STYLES)("renders a dedicated %s picker preview", (style) => {
    const { container } = render(<BallStylePreview style={style} />);
    expect(container.querySelectorAll("div").length).toBeGreaterThan(3);
  });
});
