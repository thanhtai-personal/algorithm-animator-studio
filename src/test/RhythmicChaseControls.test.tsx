import { fireEvent, render, screen } from "@testing-library/react";
import { SYSTEM_LANG_STORAGE_KEY } from "@/lib/i18n";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "../features/rhythmic-studio/defaults";
import { mediaText } from "../features/rhythmic-studio/mediaI18n";
import { saveRhythmicProject, listRhythmicProjects } from "../features/rhythmic-studio/lib/projectStorage";
import { BallStyleFrame } from "../features/rhythmic-studio/presentation/sections/BallStyleFrame";
import { RhythmicStudioStore } from "../features/rhythmic-studio/store/RhythmicStudioStore";

function studio(mode: "single" | "chase", rendererMode: "legacy" | "three" = "legacy") {
  return {
    rendererMode,
    settings: {
      ...DEFAULT_SETTINGS,
      marbleMode: mode,
      secondaryMarble: { ...DEFAULT_SETTINGS.secondaryMarble },
    },
    patch: vi.fn(),
    store: {
      setSecondaryMarbleStyle: vi.fn(),
      setSecondaryMarbleAvatar: vi.fn(),
    },
  };
}

describe("two-marble quick controls", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem(SYSTEM_LANG_STORAGE_KEY, "en");
  });

  it("switches mode and exposes independent A/B material and avatar pickers", () => {
    const single = studio("single");
    const view = render(<BallStyleFrame studio={single as never} />);
    fireEvent.click(screen.getByRole("button", { name: "2-ball chase" }));
    expect(single.patch).toHaveBeenCalledWith("marbleMode", "chase");

    const chase = studio("chase");
    view.rerender(<BallStyleFrame studio={chase as never} />);
    fireEvent.change(screen.getByLabelText("Marble A material"), { target: { value: "chrome" } });
    fireEvent.change(screen.getByLabelText("Marble B material"), { target: { value: "glass" } });
    fireEvent.change(screen.getByLabelText("Marble B avatar"), { target: { value: "animal-4" } });

    expect(chase.patch).toHaveBeenCalledWith("ballStyle", "chrome");
    expect(chase.store.setSecondaryMarbleStyle).toHaveBeenCalledWith("glass");
    expect(chase.store.setSecondaryMarbleAvatar).toHaveBeenCalledWith("animal-4");
  });

  it("keeps sprites out of WebGL and hides B controls after returning to single", () => {
    const chase3D = studio("chase", "three");
    const view = render(<BallStyleFrame studio={chase3D as never} />);
    expect(screen.queryByLabelText("Marble A avatar")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Marble B avatar")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Marble B material")).toBeVisible();

    const single = studio("single", "three");
    view.rerender(<BallStyleFrame studio={single as never} />);
    expect(screen.queryByLabelText("Marble B material")).not.toBeInTheDocument();
  });

  it("persists chase mode and the complete secondary appearance", () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      marbleMode: "chase" as const,
      secondaryMarble: {
        ...DEFAULT_SETTINGS.secondaryMarble,
        ballStyle: "glass" as const,
        marbleAvatar: "animal-4" as const,
      },
    };
    saveRhythmicProject("Chase", settings);
    const store = new RhythmicStudioStore();
    store.replaceSettings(listRhythmicProjects()[0].settings);

    expect(store.settings.marbleMode).toBe("chase");
    expect(store.settings.secondaryMarble.ballStyle).toBe("glass");
    expect(store.settings.secondaryMarble.marbleAvatar).toBe("animal-4");
    expect(mediaText("vi", "marble.mode.chase")).toBe("2 bi rượt nhau");
  });
});
