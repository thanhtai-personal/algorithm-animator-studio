import { Film, Play, Tags, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPresetVideoOutputSize } from "../outputPresets";
import type { PresetVideoDefinition } from "../types";

type Props = {
  presets: readonly PresetVideoDefinition[];
  quickExportingId: string;
  onOpen: (preset: PresetVideoDefinition) => void;
  onQuickExport: (preset: PresetVideoDefinition) => void;
};

export function PresetVideoLibrary({ presets, quickExportingId, onOpen, onQuickExport }: Props) {
  if (!presets.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center">
          <Film className="h-10 w-10 text-muted-foreground" />
          <div>
            <h2 className="font-semibold">Chưa có Preset Video</h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Các video được thêm bằng source/git patch và đăng ký trong preset registry sẽ tự xuất hiện tại đây.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {presets.map((preset) => {
        const output = getPresetVideoOutputSize(preset.defaultOutputPreset);
        return (
          <Card key={preset.id} className="overflow-hidden border-border/70">
            <div
              className="relative aspect-video overflow-hidden border-b"
              style={{ background: `radial-gradient(circle at 20% 20%, ${preset.accentColor}55, transparent 38%), linear-gradient(135deg, #020617, #111827)` }}
            >
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <WandSparkles className="mx-auto h-10 w-10" style={{ color: preset.accentColor }} />
                  <p className="mt-3 text-xs font-bold uppercase tracking-[0.24em] text-slate-300">Code Preset</p>
                  <p className="mt-1 text-lg font-black text-white">{preset.name}</p>
                </div>
              </div>
              <Badge variant="secondary" className="absolute right-3 top-3">{output.aspectRatio}</Badge>
            </div>
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg">{preset.name}</CardTitle>
              <p className="text-sm leading-relaxed text-muted-foreground">{preset.description}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="outline">{output.width}×{output.height}</Badge>
                <Badge variant="outline">{preset.defaultDurationSeconds}s</Badge>
                <Badge variant="outline">{preset.defaultFps} FPS</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <Tags className="h-3.5 w-3.5" />
                {preset.tags.join(" · ")}
              </div>
            </CardContent>
            <CardFooter className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => onOpen(preset)}>
                <Play className="mr-2 h-4 w-4" /> Mở / chỉnh
              </Button>
              <Button disabled={quickExportingId === preset.id} onClick={() => onQuickExport(preset)}>
                <Film className="mr-2 h-4 w-4" /> {quickExportingId === preset.id ? "Đang export..." : "Export ngay"}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
