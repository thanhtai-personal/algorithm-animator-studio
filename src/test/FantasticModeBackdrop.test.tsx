import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FantasticModeBackdrop } from "@/components/FantasticModeBackdrop";

describe("FantasticModeBackdrop", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("stops rendering while the window is unfocused and resumes on focus", () => {
    vi.useFakeTimers();
    const context = createCanvasContext();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(performance.now());
      return 1;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);

    render(<FantasticModeBackdrop enabled />);
    const initialStrokeCount = context.stroke.mock.calls.length;

    act(() => window.dispatchEvent(new Event("blur")));
    act(() => vi.advanceTimersByTime(500));
    expect(context.stroke).toHaveBeenCalledTimes(initialStrokeCount);

    act(() => window.dispatchEvent(new Event("focus")));
    act(() => vi.advanceTimersByTime(100));
    expect(context.stroke.mock.calls.length).toBeGreaterThan(initialStrokeCount);
  });
});

function createCanvasContext() {
  return {
    beginPath: vi.fn(),
    clearRect: vi.fn(),
    lineTo: vi.fn(),
    moveTo: vi.fn(),
    setTransform: vi.fn(),
    stroke: vi.fn(),
    globalCompositeOperation: "source-over",
    lineWidth: 1,
    strokeStyle: "",
  };
}
