import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RhythmicStudioWorkspace } from "../features/rhythmic-studio/presentation/RhythmicStudioWorkspace";

const viewport = vi.hoisted(() => ({ mobile: true }));

vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => viewport.mobile }));
vi.mock("@/hooks/use-system-lang", () => ({ useSystemLang: () => "vi" }));
vi.mock("../features/rhythmic-studio/hooks/useRhythmicStudioController", () => ({
  useRhythmicStudioController: () => ({ source: {}, sourceEvents: [], timeline: [], settings: {}, projects: [] }),
}));
vi.mock("../features/rhythmic-studio/components/RhythmicStage", () => ({ RhythmicStage: () => <div>Video stage</div> }));
vi.mock("../features/rhythmic-studio/components/RhythmicInspector", () => ({ RhythmicInspector: () => null }));
vi.mock("../features/rhythmic-studio/components/RhythmicProjectsDialog", () => ({ RhythmicProjectsDialog: () => null }));
vi.mock("../features/rhythmic-studio/presentation/RhythmicWorkspaceHeader", () => ({ RhythmicWorkspaceHeader: () => null }));
vi.mock("../features/rhythmic-studio/presentation/layouts/RhythmicControlColumns", () => ({
  RhythmicPresetControls: () => <div>Desktop scene controls</div>,
  RhythmicWorkflowControls: () => <div>Desktop production controls</div>,
}));
vi.mock("../features/rhythmic-studio/presentation/layouts/RhythmicMobileControlDock", () => ({
  RhythmicMobileControlDock: () => <div>Mobile control dock</div>,
}));
vi.mock("../features/rhythmic-studio/presentation/layouts/RhythmicPanelResizeHandle", () => ({
  RhythmicPanelResizeHandle: () => null,
}));
vi.mock("../features/rhythmic-studio/presentation/layouts/rhythmicPanelLayout", () => ({
  useRhythmicPanelLayout: () => ({
    layout: { left: 240, right: 360 },
    activeSide: null,
    beginResize: vi.fn(),
    resizeByPointerDelta: vi.fn(),
    resetLayout: vi.fn(),
  }),
}));

describe("RhythmicStudioWorkspace responsive composition", () => {
  beforeEach(() => { viewport.mobile = true; });

  it("renders the stage first and does not mount heavyweight side panels on mobile", () => {
    render(<RhythmicStudioWorkspace />);

    expect(screen.getByText("Video stage")).toBeInTheDocument();
    expect(screen.getByText("Mobile control dock")).toBeInTheDocument();
    expect(screen.queryByText("Desktop scene controls")).not.toBeInTheDocument();
    expect(screen.queryByText("Desktop production controls")).not.toBeInTheDocument();
  });

  it("keeps the resizable desktop panel composition above the mobile breakpoint", () => {
    viewport.mobile = false;
    render(<RhythmicStudioWorkspace />);

    expect(screen.getByText("Desktop scene controls")).toBeInTheDocument();
    expect(screen.getByText("Desktop production controls")).toBeInTheDocument();
    expect(screen.queryByText("Mobile control dock")).not.toBeInTheDocument();
  });
});
