import { useEffect, useMemo, useRef, useState } from "react";
import { ALGORITHMS, Frame } from "@/lib/algorithms";
import { renderFrame, THEMES, Theme } from "@/lib/renderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Pause, Play, RefreshCw, Square, Sparkles } from "lucide-react";
import { toast } from "sonner";

const W = 1080;
const H = 1920;

function randArr(n: number) {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 95) + 5);
}

const Index = () => {
  const [algoId, setAlgoId] = useState("bubble");
  const [size, setSize] = useState(20);
  const [input, setInput] = useState("");
  const [arr, setArr] = useState<number[]>(() => randArr(20));
  const [themeName, setThemeName] = useState<keyof typeof THEMES>("neon");
  const [theme, setTheme] = useState<Theme>(THEMES.neon);
  const [title, setTitle] = useState("Bubble Sort");
  const [subtitle, setSubtitle] = useState("Visualized");
  const [showCode, setShowCode] = useState(true);
  const [fps, setFps] = useState(30);
  const [speed, setSpeed] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [frameIdx, setFrameIdx] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const algo = ALGORITHMS[algoId];

  const frames: Frame[] = useMemo(() => algo.run(arr), [algo, arr]);

  useEffect(() => {
    setTitle(algo.name);
  }, [algo]);

  useEffect(() => {
    setTheme(THEMES[themeName]);
  }, [themeName]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const f = frames[Math.min(frameIdx, frames.length - 1)];
    if (!f) return;
    renderFrame(ctx, f, { title, subtitle, theme, code: algo.code, showCode }, W, H);
  }, [frames, frameIdx, title, subtitle, theme, algo.code, showCode]);

  // playback
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);
  useEffect(() => {
    if (!playing) return;
    lastRef.current = performance.now();
    const tick = (t: number) => {
      const dt = t - lastRef.current;
      const interval = 1000 / (fps * speed);
      if (dt >= interval) {
        lastRef.current = t;
        setFrameIdx((i) => {
          if (i + 1 >= frames.length) {
            setPlaying(false);
            return i;
          }
          return i + 1;
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, fps, speed, frames.length]);

  const newArray = () => {
    let a: number[];
    const trimmed = input.trim();
    if (trimmed) {
      a = trimmed
        .split(/[,\s]+/)
        .map((s) => parseInt(s, 10))
        .filter((n) => !Number.isNaN(n));
      if (!a.length) a = randArr(size);
    } else {
      a = randArr(size);
    }
    setArr(a);
    setFrameIdx(0);
    setPlaying(false);
  };

  const exportVideo = async () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    const stream = c.captureStream(0) as MediaStream & {
      getVideoTracks: () => Array<CanvasCaptureMediaStreamTrack>;
    };
    const track = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack;

    const mimeCandidates = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ];
    const mimeType = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m));
    if (!mimeType) {
      toast.error("Trình duyệt không hỗ trợ xuất video");
      return;
    }

    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const done = new Promise<Blob>((resolve) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
    });

    setExporting(true);
    setExportProgress(0);
    setPlaying(false);
    recorder.start();

    const opts = { title, subtitle, theme, code: algo.code, showCode };
    for (let i = 0; i < frames.length; i++) {
      renderFrame(ctx, frames[i], opts, W, H);
      track.requestFrame();
      setExportProgress(Math.round(((i + 1) / frames.length) * 100));
      // pacing
      await new Promise((r) => setTimeout(r, 1000 / fps));
    }
    // hold last frame briefly
    for (let i = 0; i < fps; i++) {
      track.requestFrame();
      await new Promise((r) => setTimeout(r, 1000 / fps));
    }

    recorder.stop();
    const blob = await done;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${algo.id}-${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
    toast.success("Đã xuất video!");
  };

  const current = frames[Math.min(frameIdx, frames.length - 1)];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="px-6 py-5 flex items-center gap-3 border-b border-border/40">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-slate-900" />
        </div>
        <div>
          <h1 className="text-xl font-bold">AlgoShorts Studio</h1>
          <p className="text-xs text-muted-foreground">Tạo video thuật toán cho TikTok / Reels / Shorts</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr_360px] gap-4 p-4">
        {/* Left: controls */}
        <div className="space-y-4">
          <Card className="p-4 space-y-4">
            <div>
              <Label>Thuật toán</Label>
              <Select value={algoId} onValueChange={setAlgoId}>
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(ALGORITHMS).map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mảng input (để trống = ngẫu nhiên)</Label>
              <Input
                className="mt-2"
                placeholder="vd: 5, 2, 8, 1, 9, 3"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <Label>Kích thước ngẫu nhiên</Label>
                <span className="text-emerald-400 font-mono">{size}</span>
              </div>
              <Slider value={[size]} onValueChange={([v]) => setSize(v)} min={5} max={40} step={1} />
            </div>
            <Button onClick={newArray} variant="outline" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" /> Tạo mảng mới
            </Button>
          </Card>

          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pink-500" />
              <Label className="text-sm">Code thuật toán (JS)</Label>
              <span className="ml-auto text-xs text-emerald-400">● {showCode ? "Hiển thị" : "Ẩn"}</span>
            </div>
            <pre className="text-[11px] leading-5 font-mono bg-slate-950/60 rounded-lg p-3 overflow-auto max-h-72 border border-border/40">
              {algo.code.split("\n").map((ln, i) => (
                <div
                  key={i}
                  className={`flex gap-3 px-1 ${current && current.line === i ? "bg-yellow-300/15 text-yellow-200 rounded" : "text-slate-300"}`}
                >
                  <span className="text-slate-500 w-6 text-right select-none">{i + 1}</span>
                  <span className="whitespace-pre">{ln}</span>
                </div>
              ))}
            </pre>
            <div className="flex items-center justify-between pt-1">
              <Label className="text-sm">Hiện code trong video</Label>
              <Switch checked={showCode} onCheckedChange={setShowCode} />
            </div>
          </Card>

          <Card className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              <Label className="text-sm">Variables</Label>
            </div>
            <div className="font-mono text-sm text-emerald-300 min-h-6">
              {current && Object.keys(current.vars).length
                ? Object.entries(current.vars).map(([k, v]) => `${k}=${v}`).join("  ")
                : "—"}
            </div>
          </Card>
        </div>

        {/* Center: preview */}
        <div className="flex flex-col items-center gap-4">
          <Card className="p-3 bg-card/50">
            <canvas
              ref={canvasRef}
              width={W}
              height={H}
              className="rounded-lg w-auto"
              style={{ maxHeight: "70vh", aspectRatio: `${W}/${H}` }}
            />
          </Card>
          <Card className="w-full max-w-2xl p-4 space-y-3">
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => setPlaying((p) => !p)} disabled={exporting}>
                {playing ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {playing ? "Tạm dừng" : "Phát"}
              </Button>
              <Button variant="outline" size="icon" onClick={() => { setPlaying(false); setFrameIdx(0); }}>
                <Square className="w-4 h-4" />
              </Button>
              <Button onClick={exportVideo} disabled={exporting} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-900">
                <Download className="w-4 h-4 mr-2" />
                {exporting ? `Đang xuất ${exportProgress}%` : "Xuất video"}
              </Button>
            </div>
            <Slider
              value={[frameIdx]}
              min={0}
              max={Math.max(0, frames.length - 1)}
              step={1}
              onValueChange={([v]) => { setFrameIdx(v); setPlaying(false); }}
            />
            <div className="flex justify-between text-xs text-muted-foreground font-mono">
              <span>Frame {frameIdx + 1} / {frames.length}</span>
              <span>{W}×{H}</span>
            </div>
            <div className="flex items-center gap-3">
              <Label className="text-xs whitespace-nowrap">Tốc độ</Label>
              <Slider value={[speed]} min={0.25} max={4} step={0.25} onValueChange={([v]) => setSpeed(v)} />
              <span className="font-mono text-xs w-10 text-right">{speed}x</span>
            </div>
          </Card>
        </div>

        {/* Right: appearance */}
        <Card className="p-4 h-fit">
          <Tabs defaultValue="ui">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="ui">Giao diện</TabsTrigger>
              <TabsTrigger value="motion">Xuất</TabsTrigger>
              <TabsTrigger value="audio">Âm thanh</TabsTrigger>
            </TabsList>
            <TabsContent value="ui" className="space-y-3 pt-4">
              <div>
                <Label>Tiêu đề</Label>
                <Input className="mt-2" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <Label>Phụ đề</Label>
                <Input className="mt-2" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                {(["bg","bar","highlight","swap","sorted","pivot"] as const).map((k) => (
                  <div key={k}>
                    <Label className="capitalize text-xs">{k}</Label>
                    <input
                      type="color"
                      value={theme[k]}
                      onChange={(e) => setTheme({ ...theme, [k]: e.target.value })}
                      className="mt-1 w-full h-9 rounded border border-border bg-transparent"
                    />
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {Object.keys(THEMES).map((t) => (
                  <Button key={t} size="sm" variant={themeName === t ? "default" : "outline"}
                    onClick={() => setThemeName(t as keyof typeof THEMES)}>
                    {t[0].toUpperCase() + t.slice(1)}
                  </Button>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="motion" className="space-y-3 pt-4">
              <div>
                <div className="flex justify-between mb-2">
                  <Label>FPS</Label>
                  <span className="font-mono text-emerald-400">{fps}</span>
                </div>
                <Slider value={[fps]} min={15} max={60} step={1} onValueChange={([v]) => setFps(v)} />
              </div>
              <p className="text-xs text-muted-foreground">
                Video xuất dạng WebM (1080×1920) bao gồm chart và panel code.
              </p>
            </TabsContent>
            <TabsContent value="audio" className="pt-4">
              <p className="text-xs text-muted-foreground">Tùy chọn âm thanh sẽ sớm cập nhật.</p>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Index;
