import { Film, GitPullRequestArrow } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { PresetVideoLibrary } from "@/features/preset-video/components/PresetVideoLibrary";
import { PresetVideoWorkspace } from "@/features/preset-video/components/PresetVideoWorkspace";
import { PRESET_VIDEO_REGISTRY, getPresetVideoDefinition } from "@/features/preset-video/presetVideoRegistry";
import { createDefaultPresetVideoSettings } from "@/features/preset-video/lib/presetVideoDraft";
import { renderPresetVideo } from "@/features/preset-video/lib/presetVideoApi";
import type { PresetVideoDefinition } from "@/features/preset-video/types";

export default function PresetVideos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [quickExportingId, setQuickExportingId] = useState("");
  const selectedId = searchParams.get("preset") || "";
  const selectedPreset = selectedId ? getPresetVideoDefinition(selectedId) : undefined;

  function openPreset(preset: PresetVideoDefinition) {
    setSearchParams({ preset: preset.id });
  }

  async function quickExport(preset: PresetVideoDefinition) {
    setQuickExportingId(preset.id);
    try {
      const result = await renderPresetVideo({
        preset,
        settings: createDefaultPresetVideoSettings(preset),
      });
      toast.success(`Đã export ${result.fileName} vào Generated Assets.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Quick export thất bại.");
    } finally {
      setQuickExportingId("");
    }
  }

  if (selectedPreset) {
    return (
      <main className="min-h-[calc(100dvh-65px)] bg-background/70 p-3 pb-20 md:p-5">
        <div className="mx-auto max-w-[1920px]">
          <PresetVideoWorkspace preset={selectedPreset} onBack={() => setSearchParams({})} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100dvh-65px)] bg-background/70 p-4 md:p-6">
      <section className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-col gap-3 rounded-xl border bg-card/70 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <Film className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-[0.26em]">Preset Video Library</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">Kho video từ source code</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Mỗi preset được AI thêm bằng git patch. Có thể export ngay hoặc mở workspace để đổi size, cắt đoạn và thêm nhạc nền.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            <GitPullRequestArrow className="h-4 w-4 text-primary" />
            {PRESET_VIDEO_REGISTRY.length} preset đã đăng ký
          </div>
        </header>

        {selectedId && !selectedPreset ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            Preset "{selectedId}" không còn tồn tại trong source registry.
          </div>
        ) : null}

        <PresetVideoLibrary
          presets={PRESET_VIDEO_REGISTRY}
          quickExportingId={quickExportingId}
          onOpen={openPreset}
          onQuickExport={(preset) => void quickExport(preset)}
        />
      </section>
    </main>
  );
}
