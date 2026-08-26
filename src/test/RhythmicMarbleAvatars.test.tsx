import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import { BallStyleFrame } from "../features/rhythmic-studio/presentation/sections/BallStyleFrame";
import {
  MARBLE_AVATARS,
  marbleAvatarEntry,
  marbleAvatarText,
} from "../features/rhythmic-studio/lib/marbleAvatars";
import { marbleAvatarMotion2D } from "../features/rhythmic-studio/lib/marbleAvatarMotion2D";
import type { MarblePlatform } from "../features/rhythmic-studio/engine/marblePhysicsTypes";

describe("rhythmic marble avatars", () => {
  it("offers the ball plus the complete cute animal sprite collection", () => {
    expect(DEFAULT_SETTINGS.marbleAvatar).toBe("ball");
    expect(MARBLE_AVATARS).toHaveLength(22);
    expect(marbleAvatarEntry("animal-8")?.label).toBe("Red Panda");
    expect(marbleAvatarText("vi", "animal-2")).toBe("Chuột hamster");
  });

  it("chooses takeoff, apex and landing poses from the current physical flight", () => {
    const events = [
      { id: "a", timeMs: 1_000, midi: 60, velocity: 0.8, durationMs: 200 },
      { id: "b", timeMs: 2_000, midi: 64, velocity: 0.8, durationMs: 200 },
    ];
    const platforms = events.map((event, index) => ({
      index, event, x: index * 100, y: index * 80, hitX: index * 100, hitY: index * 80,
      width: 80, thickness: 20, tiltRad: 0, color: "#fff", contactX: 0, contactY: 0,
      normalX: 0, normalY: -1, outVX: 100, outVY: -200, gravity: 500, contactMode: "surface" as const,
      motionMode: "ballistic" as const,
    })) satisfies MarblePlatform[];
    const point = { x: 50, y: -40, color: "#fff", platformIndex: 0 };

    expect(marbleAvatarMotion2D(1_020, events, platforms, point, point, { ...point, x: 54, y: -46 }).frameIndex).toBe(0);
    expect(marbleAvatarMotion2D(1_500, events, platforms, point, { ...point, x: 46, y: -40 }, { ...point, x: 54, y: -40 }).frameIndex).toBe(3);
    expect(marbleAvatarMotion2D(1_960, events, platforms, point, { ...point, x: 46, y: -46 }, { ...point, x: 54, y: -40 }).frameIndex).toBe(5);
    expect(marbleAvatarMotion2D(1_500, events, platforms, point, { ...point, x: 54 }, { ...point, x: 46 }).facing).toBe(-1);
  });

  it("selects an animated character independently from the ball material", () => {
    const patch = vi.fn();
    const { container } = render(<BallStyleFrame studio={{ rendererMode: "legacy", settings: { ...DEFAULT_SETTINGS }, patch } as never} />);

    expect(container.querySelectorAll("[data-marble-avatar-preview] canvas")).toHaveLength(21);
    expect(container.querySelectorAll("[data-marble-avatar-preview] img")).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: /Hamster/i }));
    expect(patch).toHaveBeenCalledWith("marbleAvatar", "animal-2");
  });

  it("marks the selected character and hides irrelevant ball materials", () => {
    render(<BallStyleFrame studio={{
      settings: { ...DEFAULT_SETTINGS, marbleAvatar: "animal-2" },
      rendererMode: "legacy",
      patch: vi.fn(),
    } as never} />);

    expect(screen.getByRole("button", { name: /Hamster/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("button", { name: "Classic" })).not.toBeInTheDocument();
  });

  it("does not offer 2D sprite characters in WebGL mode", () => {
    render(<BallStyleFrame studio={{
      rendererMode: "three",
      settings: { ...DEFAULT_SETTINGS, marbleAvatar: "animal-2" },
      patch: vi.fn(),
    } as never} />);

    expect(screen.queryByRole("button", { name: /Hamster/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Classic" })).toBeInTheDocument();
  });
});
