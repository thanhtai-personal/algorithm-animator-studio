import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AppLayout } from "../components/AppLayout";

vi.mock("../components/AppHeader", () => ({
  AppHeader: ({ sidebarMode, onToggleSidebar }: { sidebarMode: string; onToggleSidebar: () => void }) => (
    <button type="button" onClick={onToggleSidebar}>Header sidebar: {sidebarMode}</button>
  ),
}));
vi.mock("../components/AppSidebar", () => ({
  AppSidebar: ({ mode }: { mode: string }) => <div>Sidebar mode: {mode}</div>,
}));
vi.mock("../components/BackgroundJobsNotifier", () => ({
  BackgroundJobsNotifier: () => <div data-testid="background-jobs-notifier" />,
}));
vi.mock("../components/ChillMusicNotifier", () => ({ ChillMusicNotifier: () => null }));
vi.mock("../components/FantasticModeBackdrop", () => ({ FantasticModeBackdrop: () => null }));
vi.mock("@/hooks/use-fantastic-frame-motion", () => ({ useFantasticFrameMotion: () => undefined }));
vi.mock("@/hooks/use-fantastic-mode", () => ({ useFantasticMode: () => [false] }));
vi.mock("@/lib/chillMusicSettings", () => ({ readChillModeEnabled: () => false, subscribeChillMode: () => () => undefined }));
vi.mock("@/lib/i18n", () => ({ readSystemLang: () => "vi", subscribeSystemLang: () => () => undefined }));

describe("AppLayout mobile sidebar", () => {
  it("starts closed on mobile without overwriting the saved desktop layout", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    window.localStorage.setItem("kai-studio.sidebar.mode", "expanded");

    render(<MemoryRouter initialEntries={["/algorithms/rhythmic"]}><AppLayout><div>Rhythmic page</div></AppLayout></MemoryRouter>);

    expect(screen.getByText("Sidebar mode: hidden")).toBeInTheDocument();
    expect(window.localStorage.getItem("kai-studio.sidebar.mode")).toBe("expanded");

    fireEvent.click(screen.getByRole("button", { name: "Header sidebar: hidden" }));
    expect(screen.getByText("Sidebar mode: expanded")).toBeInTheDocument();
    expect(window.localStorage.getItem("kai-studio.sidebar.mode")).toBe("expanded");
    expect(screen.queryByTestId("background-jobs-notifier")).not.toBeInTheDocument();
  });

  it("keeps the background job connection available outside rendering-heavy studios", () => {
    render(<MemoryRouter initialEntries={["/videos"]}><AppLayout><div>Videos page</div></AppLayout></MemoryRouter>);

    expect(screen.getByTestId("background-jobs-notifier")).toBeInTheDocument();
  });
});
