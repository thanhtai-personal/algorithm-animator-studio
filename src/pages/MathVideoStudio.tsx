import { useEffect, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { ArrowUpRight, BookOpen, Download, Film, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { readSystemLang, subscribeSystemLang } from "@/lib/i18n";
import { mathVideoPreset } from "@/features/math-video/mathVideoPreset";
import { MathNarrationPanel, type MixedNarration } from "@/features/math-video/MathNarrationPanel";
import { MATH_CHAPTERS, MATH_FPS, MATH_FRAMES, MATH_HEIGHT, MATH_SECONDS, MATH_WIDTH, formatMathTime } from "@/features/math-video/mathTimeline";
import { PresetVideoComposition, DEFAULT_PRESET_VIDEO_COMPOSITION_PROPS } from "@/features/preset-video/PresetVideoComposition";
import { createDefaultPresetVideoSettings } from "@/features/preset-video/lib/presetVideoDraft";
import { renderPresetVideo } from "@/features/preset-video/lib/presetVideoApi";
import type { PresetVideoRenderResponse } from "@/features/preset-video/types";

const BASE_PLAYER_PROPS = {
  ...DEFAULT_PRESET_VIDEO_COMPOSITION_PROPS,
  presetId: mathVideoPreset.id,
  durationSeconds: MATH_SECONDS,
  fps: MATH_FPS,
  language: "vi" as const,
  aspectRatio: "16:9" as const,
};
type ExportRange = "full" | "intro";

export default function MathVideoStudio() {
  const player = useRef<PlayerRef>(null);
  const [lang, setLang] = useState(() => readSystemLang("vi"));
  const [exporting, setExporting] = useState(false);
  const [range, setRange] = useState<ExportRange>("intro");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<PresetVideoRenderResponse | null>(null);
  const [mixedNarration, setMixedNarration] = useState<MixedNarration|null>(null);
  const [voiceVolume, setVoiceVolume] = useState(0.95);
  const playerProps = {
    ...BASE_PLAYER_PROPS,
    voiceoverAudioUrl: mixedNarration?.audioUrl || "",
    voiceoverVolume: voiceVolume,
  };
  const isVi = lang === "vi";
  useEffect(() => subscribeSystemLang(setLang), []);

  async function exportVideo() {
    if (exporting) return;
    setExporting(true);
    setResult(null);
    setProgress(0);
    setMessage(isVi ? "Chuẩn bị render..." : "Preparing render...");
    try {
      const settings = createDefaultPresetVideoSettings(mathVideoPreset);
      settings.trimEndSeconds = range === "intro" ? 40 : MATH_SECONDS;
      settings.voiceoverAudioRelativePath = mixedNarration?.relativePath || "";
      settings.voiceoverVolume = voiceVolume;
      const rendered = await renderPresetVideo({
        preset: mathVideoPreset,
        settings,
        language: lang,
      }, (event) => {
        setProgress(Math.round(event.progress * 100));
        setMessage(event.message);
      });
      setResult(rendered);
      setProgress(100);
      setMessage(isVi ? "Hoàn thành MP4" : "MP4 ready");
      toast.success(isVi ? "Đã lưu video vào Generated Assets." : "Video saved to Generated Assets.");
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Render failed";
      setMessage(detail);
      toast.error(detail);
    } finally {
      setExporting(false);
    }
  }

  return (
    <main className="min-h-[calc(100dvh-65px)] bg-background p-4 pb-16 md:p-6">
      <div className="mx-auto max-w-[1580px] space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card/70 px-5 py-5">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-500">
              <Film className="h-4 w-4" /> Math Video Studio · v1
            </div>
            <h1 className="text-2xl font-bold">{isVi ? "Video toán học — Sin & Cos" : "Math Video — Sin & Cos"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isVi
                ? "Dựng bằng mã nguồn SVG và Remotion. Bản v1 đang đối chiếu chi tiết với video tham chiếu."
                : "Code-generated SVG and Remotion scenes. V1 fidelity is still being checked against the reference."}
            </p>
          </div>
          <div className="rounded-lg border px-3 py-2 text-xs text-muted-foreground">{MATH_WIDTH}×{MATH_HEIGHT} · {MATH_FPS} FPS · {formatMathTime(MATH_FRAMES)}</div>
        </header>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,0.8fr)]">
          <section className="min-w-0 space-y-3">
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-black shadow-lg">
              <Player
                ref={player}
                component={PresetVideoComposition}
                inputProps={playerProps}
                durationInFrames={MATH_FRAMES}
                fps={MATH_FPS}
                compositionWidth={MATH_WIDTH}
                compositionHeight={MATH_HEIGHT}
                controls
                autoPlay={false}
                initiallyMuted={false}
                style={{ width: "100%", aspectRatio: "16 / 9" }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {isVi
                ? "Preview có thể tua toàn bộ 10:09. Các cảnh sau mốc 00:40 đang dùng chapter timing xấp xỉ; chưa đạt tiêu chí giống hệt video gốc."
                : "Seekable full-length preview. Chapter timing after 00:40 is approximate and not yet frame-accurate."}
            </p>
            <div className="rounded-xl border bg-card/60 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><BookOpen className="h-4 w-4" /> {isVi ? "Đi đến phân cảnh" : "Jump to chapter"}</div>
              <div className="grid gap-2 sm:grid-cols-2">
                {MATH_CHAPTERS.map((chapter, index) => (
                  <button key={chapter.id} type="button"
                    className="flex items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:border-cyan-500 hover:bg-cyan-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500"
                    onClick={() => player.current?.seekTo(chapter.start)}>
                    <span className="w-12 shrink-0 font-mono text-xs text-cyan-500">{formatMathTime(chapter.start)}</span>
                    <span className="min-w-0 truncate">{String(index + 1).padStart(2, "0")} · {chapter.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <div className="space-y-4">
          <aside className="space-y-4 rounded-2xl border bg-card/70 p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Download className="h-5 w-5 text-cyan-500"/> {isVi ? "Xuất video MP4" : "Export MP4"}</h2>
            <p className="text-sm text-muted-foreground">
              {isVi ? "Dùng renderer Remotion của KAI STUDIO, có tiến độ xử lý và lưu vào Generated Assets." : "Uses existing KAI STUDIO Remotion renderer and Generated Assets."}
            </p>
            <div className="grid gap-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm">
                <input type="radio" name="math-export-range" checked={range === "intro"} onChange={() => setRange("intro")} disabled={exporting}/>
                <span>{isVi ? "40 giây đầu (kiểm thử)" : "First 40 seconds (test)"}</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm">
                <input type="radio" name="math-export-range" checked={range === "full"} onChange={() => setRange("full")} disabled={exporting}/>
                <span>{isVi ? "Toàn bộ video 10:09" : "Full 10:09 video"}</span>
              </label>
            </div>
            <Button className="w-full" disabled={exporting} onClick={() => void exportVideo()}>
              {exporting ? <PlayCircle className="mr-2 h-4 w-4 animate-pulse"/> : <Download className="mr-2 h-4 w-4"/>}
              {exporting ? (isVi ? "Đang render..." : "Rendering...") : (isVi ? "Tạo video MP4" : "Render MP4")}
            </Button>
            {(exporting || progress > 0 || message) && <div className="space-y-2" role="status" aria-live="polite">
              <Progress value={progress}/><div className="flex justify-between gap-2 text-xs text-muted-foreground">
                <span className="break-words">{message}</span><span className="shrink-0">{progress}%</span>
              </div>
            </div>}
            {result && <a href={result.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-500 p-3 text-sm text-cyan-500 hover:bg-cyan-500/10">
              {isVi ? "Xem video đã xuất" : "Open rendered video"} <ArrowUpRight className="h-4 w-4"/>
            </a>}
            <p className="text-xs text-muted-foreground">{isVi
              ? "Âm thanh do bạn tự tạo qua Supertonic. Bản dựng không dùng âm thanh gốc; hãy kiểm thử 40 giây trước khi render toàn bộ."
              : "User-generated voice-over is supported; source audio is not bundled. Test the 40-second clip first."}</p>
          </aside>
          <MathNarrationPanel onMix={setMixedNarration} onInvalidate={() => setMixedNarration(null)}
            volume={voiceVolume} onVolumeChange={setVoiceVolume} isVi={isVi}/>
          </div>
        </div>
      </div>
    </main>
  );
}
