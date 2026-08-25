import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RhythmicMobileControlDock } from "../features/rhythmic-studio/presentation/layouts/RhythmicMobileControlDock";

vi.mock("@/hooks/use-system-lang", () => ({ useSystemLang: () => "vi" }));
vi.mock("../features/rhythmic-studio/presentation/layouts/RhythmicControlColumns", () => ({
  RhythmicPresetControls: () => <div>Mobile scene controls</div>,
  RhythmicWorkflowControls: () => <div>Mobile production controls</div>,
}));

describe("RhythmicMobileControlDock", () => {
  const studio = {} as never;

  it("keeps the large control panels out of the mobile page until requested", () => {
    render(<RhythmicMobileControlDock studio={studio} />);

    expect(screen.queryByText("Mobile scene controls")).not.toBeInTheDocument();
    expect(screen.queryByText("Mobile production controls")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Kho cảnh" }));

    expect(screen.getByText("Mobile scene controls")).toBeInTheDocument();
    expect(screen.queryByText("Mobile production controls")).not.toBeInTheDocument();
  });

  it("opens production controls from a dedicated touch-sized action", () => {
    render(<RhythmicMobileControlDock studio={studio} />);

    const trigger = screen.getByRole("button", { name: "Bảng điều khiển sản xuất" });
    expect(trigger).toHaveClass("min-h-11");

    fireEvent.click(trigger);

    expect(screen.getByText("Mobile production controls")).toBeInTheDocument();
    expect(screen.queryByText("Mobile scene controls")).not.toBeInTheDocument();
  });
});
