import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppLayout } from "../components/AppLayout";

vi.mock("../components/AppHeader", () => ({
  AppHeader: ({ sidebarMode, onToggleSidebar }: { sidebarMode: string; onToggleSidebar: () => void }) => (
    <button type="button" onClick={onToggleSidebar}>Header sidebar: {sidebarMode}</button>
  ),
}));
vi.mock("../components/AppSidebar", () => ({
  AppSidebar: ({ mode, onClose }: { mode: string; onClose: () => void }) => (
    <div>
      <span>Sidebar mode: {mode}</span>
      <button type="button" onClick={onClose}>Close sidebar</button>
    </div>
  ),
}));
vi.mock("../components/ChillMusicNotifier", () => ({
  ChillMusicNotifier: ({ enabled }: { enabled: boolean }) => <div data-testid="chill-notifier" data-enabled={String(enabled)} />,
}));
vi.mock("@/hooks/use-fantastic-mode", () => ({ useFantasticMode: () => [true] }));
vi.mock("@/lib/chillMusicSettings", () => ({ readChillModeEnabled: () => false, subscribeChillMode: () => () => undefined }));
vi.mock("@/lib/i18n", () => ({ readSystemLang: () => "vi", subscribeSystemLang: () => () => undefined }));

describe("OSS AppLayout sidebar and local tools", () => {
  beforeEach(() => {
    window.localStorage.removeItem("kai-studio.sidebar.mode");
  });

  it("starts closed on mobile without overwriting saved desktop layout", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    window.localStorage.setItem("kai-studio.sidebar.mode", "expanded");

    render(<MemoryRouter initialEntries={["/algorithms"]}><AppLayout><div>Algorithm page</div></AppLayout></MemoryRouter>);

    expect(screen.getByText("Sidebar mode: hidden")).toBeInTheDocument();
    expect(window.localStorage.getItem("kai-studio.sidebar.mode")).toBe("expanded");
    fireEvent.click(screen.getByRole("button", { name: "Header sidebar: hidden" }));
    expect(screen.getByText("Sidebar mode: expanded")).toBeInTheDocument();
    expect(window.localStorage.getItem("kai-studio.sidebar.mode")).toBe("expanded");
    fireEvent.click(screen.getByRole("button", { name: "Close sidebar" }));
    expect(screen.getByText("Sidebar mode: hidden")).toBeInTheDocument();
  });

  it("renders algorithm content and keeps optional music disabled", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    render(<MemoryRouter initialEntries={["/algorithms/maze"]}><AppLayout><div>Maze preview</div></AppLayout></MemoryRouter>);
    expect(screen.getByText("Maze preview")).toBeInTheDocument();
    expect(screen.getByTestId("chill-notifier")).toHaveAttribute("data-enabled", "false");
  });
});
