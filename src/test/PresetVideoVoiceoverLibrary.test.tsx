import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PresetVideoVoiceoverLibrary } from "@/features/preset-video/components/PresetVideoVoiceoverLibrary";
import type { GeneratedAsset } from "@/lib/generatedAssetsApi";
import { getGeneratedAudioAssets } from "@/lib/generatedAssetsApi";

vi.mock("@/lib/generatedAssetsApi", () => ({ getGeneratedAudioAssets: vi.fn() }));

const audio: GeneratedAsset[] = [
  { kind: "audio", fileName: "gpts-mcp-control-plane-vi-voiceover-001.wav", relativePath: "2026-09-12/gpts-mcp-control-plane-vi-voiceover-001.wav", url: "/generated/old.wav", sizeBytes: 100, createdAtMs: 100 },
  { kind: "audio", fileName: "gpts-mcp-control-plane-vi-voiceover-002.wav", relativePath: "2026-09-13/gpts-mcp-control-plane-vi-voiceover-002.wav", url: "/generated/new.wav", sizeBytes: 100, createdAtMs: 200 },
];

describe("preset voiceover library", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getGeneratedAudioAssets).mockResolvedValue(audio);
  });

  it("lets an earlier generated voice replace the selected preview and export paths", async () => {
    const onSelect = vi.fn();
    const view = render(<PresetVideoVoiceoverLibrary presetId="gpts-mcp-control-plane" language="vi" selectedPath={audio[1].relativePath} disabled={false} refreshKey={0} onSelect={onSelect} />);

    fireEvent.change(await screen.findByRole("textbox", { name: "Tìm voice đã tạo" }), { target: { value: "001" } });
    fireEvent.click(screen.getByRole("button", { name: `Nghe thử ${audio[0].fileName}` }));
    expect(view.container.querySelector("audio")).toHaveAttribute("src", audio[0].url);
    fireEvent.click(screen.getByRole("button", { name: `Dùng ${audio[0].fileName}` }));

    expect(onSelect).toHaveBeenCalledWith({ voiceoverAudioRelativePath: audio[0].relativePath, voiceoverAudioUrl: audio[0].url });
  });

  it("reloads the server list after a new voice is generated", async () => {
    const onSelect = vi.fn();
    const props = { presetId: "gpts-mcp-control-plane", language: "vi" as const, selectedPath: "", disabled: false, onSelect };
    const view = render(<PresetVideoVoiceoverLibrary {...props} refreshKey={0} />);
    await screen.findByText(audio[0].fileName);
    view.rerender(<PresetVideoVoiceoverLibrary {...props} refreshKey={1} />);
    await waitFor(() => expect(getGeneratedAudioAssets).toHaveBeenCalledTimes(2));
  });
});
