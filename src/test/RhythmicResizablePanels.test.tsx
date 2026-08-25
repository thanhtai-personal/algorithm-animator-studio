import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SYSTEM_LANG_STORAGE_KEY } from "@/lib/i18n";
import { RhythmicWorkspaceHeader } from "../features/rhythmic-studio/presentation/RhythmicWorkspaceHeader";
import { RhythmicPanelResizeHandle } from "../features/rhythmic-studio/presentation/layouts/RhythmicPanelResizeHandle";

describe("rhythmic resizable panels", () => {
  beforeEach(() => window.localStorage.clear());

  it("starts pointer resizing and supports precise keyboard resizing", () => {
    const beginResize = vi.fn();
    const resizeByPointerDelta = vi.fn();

    render(
      <RhythmicPanelResizeHandle
        side="left"
        width={240}
        active={false}
        label="Resize scene panel"
        onBeginResize={beginResize}
        onResizeByPointerDelta={resizeByPointerDelta}
      />,
    );

    const separator = screen.getByRole("separator", { name: "Resize scene panel" });
    expect(separator).toHaveAttribute("aria-valuenow", "240");

    fireEvent.pointerDown(separator, { button: 0, clientX: 120 });
    expect(beginResize).toHaveBeenCalledWith("left", 120);

    fireEvent.keyDown(separator, { key: "ArrowRight" });
    expect(resizeByPointerDelta).toHaveBeenCalledWith("left", 16);
  });

  it("exposes a header action that resets the saved layout", () => {
    window.localStorage.setItem(SYSTEM_LANG_STORAGE_KEY, "vi");
    const resetLayout = vi.fn();

    render(
      <RhythmicWorkspaceHeader
        status="Ready"
        sourceName="Demo.mid"
        playing={false}
        onInfo={vi.fn()}
        onProjects={vi.fn()}
        onRandomize={vi.fn()}
        onResetLayout={resetLayout}
        onSave={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Đặt lại bố cục" }));
    expect(resetLayout).toHaveBeenCalledOnce();
  });
});
