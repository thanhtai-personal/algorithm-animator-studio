import { useEffect, useRef, useState } from "react";
import { Download, Pause, Play, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  drawDuelScene, DUEL_DURATION, DUEL_FPS, DUEL_FRAMES,
  DUEL_HEIGHT, DUEL_WIDTH,
} from "@/features/action-duel/scene";

const videoTypes = [
  "video/mp4;codecs=avc1.42E01E",
  "video/mp4",
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
];

export default function ActionDuelStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playbackStartFrame = useRef(0);
  const exportAnimationRef = useRef<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [seed, setSeed] = useState(42);
  const [glow, setGlow] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [showHud, setShowHud] = useState(true);
  const [message, setMessage] = useState("");
  const settings = { seed, glow, showHud };

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) drawDuelScene(ctx, frame / DUEL_FPS, settings);
  }, [frame, seed, glow, showHud]);

  useEffect(() => {
    if (!playing || exporting) return;
    const start = performance.now();
    const initialFrame = playbackStartFrame.current;
    let animation = 0;
    const tick = (now: number) => {
      const next = Math.min(DUEL_FRAMES - 1, initialFrame + Math.floor((now - start) * DUEL_FPS * speed / 1000));
      setFrame(next);
      if (next >= DUEL_FRAMES - 1) {
        setPlaying(false);
      } else {
        animation = requestAnimationFrame(tick);
      }
    };
    animation = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animation);
    // Capture starting frame when playback begins, not every animation tick.
  }, [playing, exporting, speed]);

  useEffect(() => () => {
    if (exportAnimationRef.current !== null) cancelAnimationFrame(exportAnimationRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  function reset() {
    if (exporting) return;
    setPlaying(false);
    setFrame(0);
  }

  function exportMovie() {
    const canvas = canvasRef.current;
    if (!canvas || exporting) return;
    if (typeof MediaRecorder === "undefined" || !canvas.captureStream) {
      toast.error("Trình duyệt không hỗ trợ xuất video Canvas.");
      return;
    }
    const type = videoTypes.find((candidate) => MediaRecorder.isTypeSupported(candidate));
    if (!type) {
      toast.error("Trình duyệt không hỗ trợ ghi WebM hoặc MP4.");
      return;
    }

    setPlaying(false);
    setExporting(true);
    setFrame(0);
    setMessage("Đang ghi video. Giữ tab đang mở trong quá trình xuất.");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setExporting(false);
      return;
    }
    // Capture the configured settings once so changes cannot mutate a recording.
    const exportSettings = { seed, glow, showHud };
    let stream: MediaStream;
    let recorder: MediaRecorder;
    try {
      drawDuelScene(ctx, 0, exportSettings);
      stream = canvas.captureStream(DUEL_FPS);
      recorder = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 4_000_000 });
    } catch {
      setExporting(false);
      toast.error("Không khởi tạo được trình ghi video.");
      return;
    }
    streamRef.current = stream;
    recorderRef.current = recorder;
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    let recorderFailed = false;
    recorder.onerror = () => {
      recorderFailed = true;
      setMessage("Xuất video thất bại. Hãy thử trình duyệt Chromium.");
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      recorderRef.current = null;
      exportAnimationRef.current = null;
      setExporting(false);
      if (recorderFailed || !chunks.length) {
        toast.error("Không nhận được dữ liệu video.");
        return;
      }
      const extension = type.startsWith("video/mp4") ? "mp4" : "webm";
      const blob = new Blob(chunks, { type: type.split(";")[0] });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "kai-studio-action-duel." + extension;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setMessage("Đã tạo bản ghi " + extension.toUpperCase() + " (không có âm thanh).");
      toast.success("Đã xuất video!");
    };
    recorder.start(200);
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = Math.min(DUEL_DURATION, (now - startTime) / 1000);
      drawDuelScene(ctx, elapsed, exportSettings);
      setFrame(Math.min(DUEL_FRAMES - 1, Math.floor(elapsed * DUEL_FPS)));
      if (elapsed >= DUEL_DURATION) {
        if (recorder.state === "recording") recorder.stop();
      } else {
        exportAnimationRef.current = requestAnimationFrame(tick);
      }
    };
    exportAnimationRef.current = requestAnimationFrame(tick);
  }

  return (
    <main className="mx-auto max-w-6xl space-y-5 px-4 py-6 text-foreground">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-cyan-400">
          <Sparkles className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-[.2em]">KAI STUDIO / Experimental</span>
        </div>
        <h1 className="text-2xl font-bold md:text-3xl">Action Duel Studio</h1>
        <p className="text-sm text-muted-foreground">
          Bản dựng thử cảnh đấu boss 2D sci-fi: nhân vật, nền mạch điện, slash trails,
          tia lửa, combo và HUD được vẽ bằng Canvas, không dùng sprite từ game gốc.
        </p>
      </header>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_285px]">
        <div className="space-y-4">
          <Card className="overflow-hidden border-cyan-900/60 bg-[#01040c] p-3">
            <canvas
              ref={canvasRef}
              width={DUEL_WIDTH}
              height={DUEL_HEIGHT}
              className="mx-auto block h-auto w-full max-w-[960px] rounded-sm"
              style={{ imageRendering: "auto" }}
              aria-label="Bản xem trước hoạt cảnh chiến đấu hai chiều"
            />
          </Card>
          <Card className="space-y-4 p-4">
            <div className="flex flex-wrap gap-2">
              <Button disabled={exporting} onClick={() => { playbackStartFrame.current = frame === DUEL_FRAMES - 1 ? 0 : frame; if (frame === DUEL_FRAMES - 1) setFrame(0); setPlaying(!playing); }}>
                {playing ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                {playing ? "Tạm dừng" : "Phát"}
              </Button>
              <Button variant="outline" disabled={exporting} onClick={reset}>
                <RotateCcw className="mr-2 h-4 w-4" /> Về đầu
              </Button>
              <Button disabled={exporting} variant="secondary" onClick={exportMovie}>
                <Download className="mr-2 h-4 w-4" /> {exporting ? "Đang xuất..." : "Xuất video"}
              </Button>
            </div>
            <label htmlFor="duel-timeline" className="flex justify-between text-xs text-muted-foreground">
              <span>Timeline / {DUEL_FPS} FPS</span>
              <span>{(frame / DUEL_FPS).toFixed(1)}s / {DUEL_DURATION}s</span>
            </label>
            <input
              id="duel-timeline"
              type="range"
              min={0}
              max={DUEL_FRAMES - 1}
              value={frame}
              disabled={exporting}
              onChange={(event) => { setPlaying(false); setFrame(Number(event.target.value)); }}
              className="w-full accent-cyan-400"
            />
            {message ? <p aria-live="polite" className="text-xs text-muted-foreground">{message}</p> : null}
          </Card>
        </div>
        <Card className="h-fit space-y-5 p-5">
          <h2 className="font-semibold">Thiết lập hoạt cảnh</h2>
          <label className="block space-y-2 text-sm" htmlFor="duel-seed">
            <span>Biến thể hạt / Seed</span>
            <input id="duel-seed" type="number" value={seed} disabled={exporting}
              onChange={(event) => setSeed(Number(event.target.value) || 0)}
              className="h-10 w-full rounded-md border border-input bg-background px-3" />
          </label>
          <label className="block space-y-2 text-sm" htmlFor="duel-glow">
            <span>Cường độ hiệu ứng · {glow.toFixed(1)}</span>
            <input id="duel-glow" type="range" min=".25" max="1.75" step=".05"
              value={glow} disabled={exporting} onChange={(event) => setGlow(Number(event.target.value))}
              className="w-full accent-cyan-400" />
          </label>
          <label className="block space-y-2 text-sm" htmlFor="duel-speed">
            <span>Tốc độ xem trước · {speed.toFixed(1)}×</span>
            <input id="duel-speed" type="range" min=".5" max="2" step=".25"
              value={speed} disabled={exporting} onChange={(event) => { setPlaying(false); setSpeed(Number(event.target.value)); }}
              className="w-full accent-cyan-400" />
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={showHud} disabled={exporting}
              onChange={(event) => setShowHud(event.target.checked)}
              className="h-4 w-4 accent-cyan-400" />
            Hiển thị minimap, HP, combo và kỹ năng
          </label>
          <div className="space-y-2 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
            <p>Độ phân giải: {DUEL_WIDTH}×{DUEL_HEIGHT} · {DUEL_FPS} FPS · 16 giây.</p>
            <p>Xuất MP4 nếu trình duyệt hỗ trợ, nếu không sẽ dùng WebM.</p>
            <p>Đây là demo đồ họa không có nhạc/âm thanh. Xuất ghi theo thời gian thực; nên giữ tab ở phía trước.</p>
          </div>
        </Card>
      </div>
    </main>
  );
}
