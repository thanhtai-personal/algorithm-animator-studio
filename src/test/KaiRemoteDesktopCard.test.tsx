import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RemoteDesktopCard } from "../remote/RemoteDesktopCard";

afterEach(() => {
  delete window.kaiRemote;
});

describe("RemoteDesktopCard", () => {
  it("shows the packaged Windows startup state", async () => {
    window.kaiRemote = {
      getPreferences: vi.fn().mockResolvedValue({
        launchAtLogin: true,
        packaged: true,
        platform: "win32",
        startupSupported: true,
      }),
      setLaunchAtLogin: vi.fn(),
    };

    render(<RemoteDesktopCard lang="vi" />);

    expect(await screen.findByText("Ứng dụng Windows")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("switch")).toBeChecked());
    expect(screen.getByText("Đóng cửa sổ sẽ giữ bot chạy trong system tray.")).toBeInTheDocument();
  });

  it("disables Windows startup controls in a normal browser", async () => {
    render(<RemoteDesktopCard lang="en" />);

    await waitFor(() => expect(screen.getByRole("switch")).toBeDisabled());
    expect(screen.getByText(/packaged KAI Remote app/)).toBeInTheDocument();
  });
});
