import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import {
  MARBLE_AVATARS,
  marbleAvatarEntry,
  marbleAvatarText,
} from "../features/rhythmic-studio/lib/marbleAvatars";
import { normalizeSecondaryMarble } from "../features/rhythmic-studio/lib/chaseSettings";
import { BallStyleFrame } from "../features/rhythmic-studio/presentation/sections/BallStyleFrame";

describe("Haaland sprite in rhythmic Canvas 2D", () => {
  it("registers curated Haaland poses without sampling the sheet title or footer", () => {
    const entry = marbleAvatarEntry("haaland");

    expect(MARBLE_AVATARS).toContain("haaland");
    expect(entry).toMatchObject({ id: "haaland", label: "Erling Haaland" });
    expect(marbleAvatarText("vi", "haaland")).toBe("Haaland");
    expect(entry?.actions.jump.frames).toHaveLength(6);
    expect(entry?.actions.idle.frames).toHaveLength(1);

    for (const frame of [...(entry?.actions.idle.frames ?? []), ...(entry?.actions.jump.frames ?? [])]) {
      expect(frame.y).toBeGreaterThanOrEqual(100);
      expect(frame.y + frame.h).toBeLessThanOrEqual(600);
    }
  });

  it("offers Haaland in 2D and keeps the sprite out of WebGL mode", () => {
    const patch = vi.fn();
    const { rerender } = render(<BallStyleFrame studio={{
      rendererMode: "legacy",
      settings: { ...DEFAULT_SETTINGS },
      patch,
    } as never} />);

    fireEvent.click(screen.getByRole("button", { name: "Haaland" }));
    expect(patch).toHaveBeenCalledWith("marbleAvatar", "haaland");

    rerender(<BallStyleFrame studio={{
      rendererMode: "three",
      settings: { ...DEFAULT_SETTINGS, marbleAvatar: "haaland" },
      patch,
    } as never} />);
    expect(screen.queryByRole("button", { name: "Haaland" })).not.toBeInTheDocument();
  });

  it("keeps Haaland selected when a two-performer project is restored", () => {
    const restored = normalizeSecondaryMarble({
      ...DEFAULT_SETTINGS.secondaryMarble,
      marbleAvatar: "haaland",
    });

    expect(restored.marbleAvatar).toBe("haaland");
  });
});
