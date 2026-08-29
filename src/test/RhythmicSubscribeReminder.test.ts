import { describe, expect, it, vi } from "vitest";
import {
  drawSubscribeReminder2D,
  subscribeReminderFrameAt,
  subscribeReminderLayout,
} from "../features/rhythmic-studio/lib/subscribeReminder";

describe("rhythmic subscribe reminder", () => {
  it("enters after the opening beat, holds briefly, then leaves", () => {
    expect(subscribeReminderFrameAt(500)).toMatchObject({ visible: false, opacity: 0 });

    const entering = subscribeReminderFrameAt(1_050);
    expect(entering.visible).toBe(true);
    expect(entering.opacity).toBeGreaterThan(0);
    expect(entering.opacity).toBeLessThan(1);
    expect(entering.scale).toBeLessThan(1);

    expect(subscribeReminderFrameAt(2_000)).toMatchObject({
      visible: true,
      opacity: 1,
      scale: 1,
      translateY: 0,
    });
    expect(subscribeReminderFrameAt(4_700)).toMatchObject({ visible: false, opacity: 0 });
  });

  it("stays inside a lower safe area on landscape and portrait video", () => {
    for (const [width, height] of [[1_920, 1_080], [1_080, 1_920]]) {
      const layout = subscribeReminderLayout(width, height);
      expect(layout.centerY / height).toBeGreaterThan(0.74);
      expect(layout.centerY / height).toBeLessThan(0.88);
      expect(layout.centerX - layout.width / 2).toBeGreaterThanOrEqual(width * 0.06);
      expect(layout.centerX + layout.width / 2).toBeLessThanOrEqual(width * 0.94);
      expect(layout.centerY + layout.height / 2).toBeLessThan(height * 0.9);
    }
  });

  it("draws the subscribe label only while the reminder is active", () => {
    const fillText = vi.fn();
    const method = vi.fn();
    const context = {
      save: method,
      restore: method,
      translate: method,
      scale: method,
      beginPath: method,
      arc: method,
      moveTo: method,
      lineTo: method,
      arcTo: method,
      closePath: method,
      fill: method,
      stroke: method,
      fillText,
      measureText: vi.fn(() => ({ width: 100 })),
      globalAlpha: 1,
    } as unknown as CanvasRenderingContext2D;

    drawSubscribeReminder2D(context, 1_920, 1_080, 400);
    expect(fillText).not.toHaveBeenCalled();

    drawSubscribeReminder2D(context, 1_920, 1_080, 2_000);
    expect(fillText).toHaveBeenCalledWith("SUBSCRIBE", expect.any(Number), 0);
  });
});
