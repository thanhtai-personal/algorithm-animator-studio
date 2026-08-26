import { useEffect, useState } from "react";
import { Gauge, Music2, Video } from "lucide-react";
import { useSystemLang } from "@/hooks/use-system-lang";
import { useRhythmicStudioController } from "@/features/rhythmic-studio/hooks/useRhythmicStudioController";
import { MarbleTowerControls } from "./MarbleTowerControls";
import { MarbleTowerStage } from "./MarbleTowerStage";

export function MarbleTowerVideoWorkspace() {
  const lang = useSystemLang();
  const vi = lang === "vi";
  const studio = useRhythmicStudioController();
  const [drive, setDrive] = useState(1.55);

  useEffect(() => {
    const store = studio.store;
    store.setRendererMode("three");
    store.patch("glowAnimation", true);
    store.patch("trailLength", Math.max(18, store.settings.trailLength));
    if (store.projectName === "My rhythmic run" || store.projectName === "Bản nhạc nhịp điệu của tôi") store.setProjectName("Marble Tower Video");
  }, [studio.store]);

  return <main className="min-h-[calc(100dvh-65px)] p-3 pb-20 md:p-5">
    <div className="mx-auto max-w-[1920px] space-y-4">
      <header className="flex flex-col gap-3 rounded-2xl border bg-card/70 px-4 py-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-primary"><Video className="h-4 w-4" />{vi ? "Video Creator" : "Video Creator"}</div><h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Marble Tower Video</h1><p className="mt-1 max-w-3xl text-sm text-muted-foreground">{vi ? "Màn hình đua tháp V3 được chuyển thành công cụ tạo video: nhạc/MIDI, bi & sprite, timeline, record và MP4 đều dùng lại hệ của Kai Studio." : "The V3 tower race rebuilt as a video workflow using Kai Studio music/MIDI, marbles, sprites, timeline and recorder."}</p></div>
        <div className="flex flex-wrap gap-2 text-xs"><span className="flex items-center gap-1.5 rounded-full border bg-background/70 px-3 py-1.5"><Music2 className="h-3.5 w-3.5 text-primary" />{studio.source.name}</span><span className="flex items-center gap-1.5 rounded-full border bg-background/70 px-3 py-1.5"><Gauge className="h-3.5 w-3.5 text-primary" />Drive {drive.toFixed(2)}×</span><span className="rounded-full border bg-background/70 px-3 py-1.5">{studio.timeline.length} hits</span></div>
      </header>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <MarbleTowerStage studio={studio} drive={drive} />
        <MarbleTowerControls studio={studio} drive={drive} onDriveChange={setDrive} />
      </div>
    </div>
    <audio ref={studio.audioElementRef} src={studio.audioUrl ?? undefined} preload="metadata" className="hidden" />
  </main>;
}
