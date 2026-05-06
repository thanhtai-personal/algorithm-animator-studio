import { useEffect, useMemo, useRef, useState } from "react";
import { ALGORITHMS, ALGO_GROUPS, Frame } from "@/lib/algorithms";
import { renderFrame, THEMES, Theme } from "@/lib/renderer";
import { Lang, PLATFORMS, SFX_OPTIONS, MUSIC_PRESETS, t } from "@/lib/i18n";
import { audioEngine, SfxKind, MusicPreset } from "@/lib/audio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Download, Pause, Play, RefreshCw, Square, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";

function randArr(n: number) {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 95) + 5);
}

const Index = () => {
  const [lang, setLang] = useState<Lang>("en");
  const tr = (k: Parameters<typeof t>[1]) => t(lang, k);

  const [algoId, setAlgoId] = useState("bubble");
  const [size, setSize] = useState(20);
  const [input, setInput] = useState("");
  const [target, setTarget] = useState<string>("");
  const [arr, setArr] = useState<number[]>(() => randArr(20));
  const [themeName, setThemeName] = useState<keyof typeof THEMES>("neon");
  const [theme, setTheme] = useState<Theme>(THEMES.neon);
  const [title, setTitle] = useState("Bubble Sort");
  const [subtitle, setSubtitle] = useState("Visualized");
  const [showCode, setShowCode] = useState(true);
  const [fps, setFps] = useState(30);
  const [speed, setSpeed] = useState(0.5);
  const [playing, setPlaying] = useState(false);
  const [frameIdx, setFrameIdx] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const [platformId, setPlatformId] = useState<typeof PLATFORMS[number]["id"]>("tiktok");
  const platform = PLATFORMS.find((p) => p.id === platformId)!;
  const W = platform.w;
  const H = platform.h;

  // audio
  const [sfxCompare, setSfxCompare] = useState<SfxKind>("blip");
  const [sfxSwap, setSfxSwap] = useState<SfxKind>("marimba");
  const [sfxVol, setSfxVol] = useState(60);
  const [musicVol, setMusicVol] = useState(30);
  const [musicPreset, setMusicPreset] = useState<MusicPreset>("lofi");
  const [musicUrl, setMusicUrl] = useState<string | null>(null);

  // custom code
  const [customCode, setCustomCode] = useState(ALGORITHMS.custom.code);

  const algo = ALGORITHMS[algoId];

  const frames: Frame[] = useMemo(() => {
    const targetNum = target.trim() ? parseInt(target, 10) : undefined;
    return algo.run(arr, { target: Number.isNaN(targetNum as number) ? undefined : targetNum, customCode });
  }, [algo, arr, target, customCode]);

  useEffect(() => { setTitle(algo.name); }, [algo]);
  useEffect(() => { setTheme(THEMES[themeName]); }, [themeName]);
  useEffect(() => { audioEngine.setSfxVolume(sfxVol / 100); }, [sfxVol]);
  useEffect(() => { audioEngine.setMusicVolume(musicVol / 100); }, [musicVol]);
  useEffect(() => { audioEngine.setMusicSource(musicUrl); }, [musicUrl]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const f = frames[Math.min(frameIdx, frames.length - 1)];
    if (!f) return;
    const code = algoId === "custom" ? customCode : algo.code;
    renderFrame(ctx, f, { title, subtitle, theme, code, showCode }, W, H);
  }, [frames, frameIdx, title, subtitle, theme, algo.code, showCode, algoId, customCode, W, H]);

  const playEvent = (f: Frame | null | undefined) => {
    if (!f) return;
    const ev = f.event;
    // pitch from highlighted/swap bar value 0..1
    let pitch = 0.5;
    const idx = (f.swap[0] ?? f.highlight[0]);
    if (idx != null && f.arr[idx] != null) {
      const max = Math.max(...f.arr, 1);
      pitch = f.arr[idx] / max;
    }
    if (ev === "compare") audioEngine.playSfx(sfxCompare, pitch);
    else if (ev === "swap" || ev === "found" || ev === "visit") audioEngine.playSfx(sfxSwap, pitch);
  };

  // playback
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);
  useEffect(() => {
    if (!playing) return;
    audioEngine.resume();
    lastRef.current = performance.now();
    const tick = (t: number) => {
      const dt = t - lastRef.current;
      const interval = 1000 / (fps * speed);
      if (dt >= interval) {
        lastRef.current = t;
        setFrameIdx((i) => {
          const next = i + 1;
          if (next >= frames.length) { setPlaying(false); return i; }
          playEvent(frames[next]);
          return next;
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, fps, speed, frames.length]);

  const newArray = () => {
    let a: number[];
    const trimmed = input.trim();
    if (trimmed) {
      a = trimmed.split(/[,\s]+/).map((s) => parseInt(s, 10)).filter((n) => !Number.isNaN(n));
      if (!a.length) a = randArr(size);
    } else { a = randArr(size); }
    setArr(a); setFrameIdx(0); setPlaying(false);
  };

  const onMusicUpload = (file: File) => {
    if (musicUrl) URL.revokeObjectURL(musicUrl);
    setMusicUrl(URL.createObjectURL(file));
  };

  const exportVideo = async () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    audioEngine.resume();
    const videoStream = c.captureStream(0) as MediaStream;
    const track = videoStream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack;
    const audioStream = audioEngine.getRecordStream();
    const combined = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...audioStream.getAudioTracks(),
    ]);

    const mimeCandidates = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
    const mimeType = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m));
    if (!mimeType) { toast.error(tr("unsupportedExport")); return; }

    const recorder = new MediaRecorder(combined, { mimeType, videoBitsPerSecond: 8_000_000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const done = new Promise<Blob>((resolve) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
    });

    setExporting(true); setExportProgress(0); setPlaying(false);
    audioEngine.startMusic();
    recorder.start();

    const code = algoId === "custom" ? customCode : algo.code;
    const opts = { title, subtitle, theme, code, showCode };
    for (let i = 0; i < frames.length; i++) {
      renderFrame(ctx, frames[i], opts, W, H);
      track.requestFrame();
      playEvent(frames[i].event);
      setExportProgress(Math.round(((i + 1) / frames.length) * 100));
      await new Promise((r) => setTimeout(r, 1000 / fps));
    }
    for (let i = 0; i < fps; i++) {
      track.requestFrame();
      await new Promise((r) => setTimeout(r, 1000 / fps));
    }
    recorder.stop();
    audioEngine.stopMusic();
    const blob = await done;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${algo.id}-${platform.id}-${Date.now()}.webm`; a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
    toast.success(tr("exportDone"));
  };

  const current = frames[Math.min(frameIdx, frames.length - 1)];
  const isSearch = algo.category === "search";
  const isCustom = algoId === "custom";
  const codeForPanel = isCustom ? customCode : algo.code;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="px-6 py-5 flex items-center gap-3 border-b border-border/40">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-slate-900" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{tr("appTitle")}</h1>
          <p className="text-xs text-muted-foreground">{tr("tagline")}</p>
        </div>
        <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="vi">Tiếng Việt</SelectItem>
          </SelectContent>
        </Select>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr_360px] gap-4 p-4">
        {/* Left */}
        <div className="space-y-4">
          <Card className="p-4 space-y-4">
            <div>
              <Label>{tr("algorithm")}</Label>
              <Select value={algoId} onValueChange={setAlgoId}>
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALGO_GROUPS.map((grp) => (
                    <SelectGroup key={grp.label.en}>
                      <SelectLabel>{grp.label[lang]}</SelectLabel>
                      {grp.ids.map((id) => (
                        <SelectItem key={id} value={id}>{ALGORITHMS[id].name}</SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{tr("inputArr")}</Label>
              <Input className="mt-2" placeholder="5, 2, 8, 1, 9, 3" value={input} onChange={(e) => setInput(e.target.value)} />
            </div>
            {isSearch && (
              <div>
                <Label>{tr("target")}</Label>
                <Input className="mt-2" placeholder="42" value={target} onChange={(e) => setTarget(e.target.value)} />
              </div>
            )}
            <div>
              <div className="flex justify-between mb-2">
                <Label>{tr("randomSize")}</Label>
                <span className="text-emerald-400 font-mono">{size}</span>
              </div>
              <Slider value={[size]} onValueChange={([v]) => setSize(v)} min={5} max={40} step={1} />
            </div>
            <Button onClick={newArray} variant="outline" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" /> {tr("newArray")}
            </Button>
          </Card>

          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pink-500" />
              <Label className="text-sm">{tr("codeJs")}</Label>
              <span className="ml-auto text-xs text-emerald-400">● {showCode ? "ON" : "OFF"}</span>
            </div>
            {isCustom ? (
              <>
                <Textarea
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  className="text-[11px] leading-5 font-mono h-72 bg-slate-950/60"
                />
                <p className="text-xs text-muted-foreground">{tr("customCodeHint")}</p>
              </>
            ) : (
              <pre className="text-[11px] leading-5 font-mono bg-slate-950/60 rounded-lg p-3 overflow-auto max-h-72 border border-border/40">
                {codeForPanel.split("\n").map((ln, i) => (
                  <div key={i} className={`flex gap-3 px-1 ${current && current.line === i ? "bg-yellow-300/15 text-yellow-200 rounded" : "text-slate-300"}`}>
                    <span className="text-slate-500 w-6 text-right select-none">{i + 1}</span>
                    <span className="whitespace-pre">{ln}</span>
                  </div>
                ))}
              </pre>
            )}
            <div className="flex items-center justify-between pt-1">
              <Label className="text-sm">{tr("showCodeInVideo")}</Label>
              <Switch checked={showCode} onCheckedChange={setShowCode} />
            </div>
          </Card>

          <Card className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              <Label className="text-sm">{tr("variables")}</Label>
            </div>
            <div className="font-mono text-sm text-emerald-300 min-h-6 break-all">
              {current && Object.keys(current.vars).length
                ? Object.entries(current.vars).map(([k, v]) => `${k}=${v}`).join("  ")
                : "—"}
            </div>
          </Card>
        </div>

        {/* Center */}
        <div className="flex flex-col items-center gap-4">
          <Card className="p-3 bg-card/50">
            <canvas ref={canvasRef} width={W} height={H} className="rounded-lg w-auto"
              style={{ maxHeight: "70vh", aspectRatio: `${W}/${H}` }} />
          </Card>
          <Card className="w-full max-w-2xl p-4 space-y-3">
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => { audioEngine.resume(); setPlaying((p) => !p); }} disabled={exporting}>
                {playing ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {playing ? tr("pause") : tr("play")}
              </Button>
              <Button variant="outline" size="icon" onClick={() => { setPlaying(false); setFrameIdx(0); }}>
                <Square className="w-4 h-4" />
              </Button>
              <Button onClick={exportVideo} disabled={exporting} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-900">
                <Download className="w-4 h-4 mr-2" />
                {exporting ? `${tr("exporting")} ${exportProgress}%` : tr("exportVideo")}
              </Button>
            </div>
            <Slider value={[frameIdx]} min={0} max={Math.max(0, frames.length - 1)} step={1}
              onValueChange={([v]) => { setFrameIdx(v); setPlaying(false); }} />
            <div className="flex justify-between text-xs text-muted-foreground font-mono">
              <span>Frame {frameIdx + 1} / {frames.length}</span>
              <span>{W}×{H}</span>
            </div>
            <div className="flex items-center gap-3">
              <Label className="text-xs whitespace-nowrap">{tr("speed")}</Label>
              <Slider value={[speed]} min={0.25} max={4} step={0.25} onValueChange={([v]) => setSpeed(v)} />
              <span className="font-mono text-xs w-10 text-right">{speed}x</span>
            </div>
          </Card>
        </div>

        {/* Right */}
        <Card className="p-4 h-fit">
          <Tabs defaultValue="ui">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="ui">{tr("ui")}</TabsTrigger>
              <TabsTrigger value="motion">{tr("motion")}</TabsTrigger>
              <TabsTrigger value="audio">{tr("audio")}</TabsTrigger>
            </TabsList>
            <TabsContent value="ui" className="space-y-3 pt-4">
              <div>
                <Label>{tr("title")}</Label>
                <Input className="mt-2" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <Label>{tr("subtitle")}</Label>
                <Input className="mt-2" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                {(["bg","bar","highlight","swap","sorted","pivot"] as const).map((k) => (
                  <div key={k}>
                    <Label className="capitalize text-xs">{k}</Label>
                    <input type="color" value={theme[k]}
                      onChange={(e) => setTheme({ ...theme, [k]: e.target.value })}
                      className="mt-1 w-full h-9 rounded border border-border bg-transparent" />
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {Object.keys(THEMES).map((tname) => (
                  <Button key={tname} size="sm" variant={themeName === tname ? "default" : "outline"}
                    onClick={() => setThemeName(tname as keyof typeof THEMES)}>
                    {tname[0].toUpperCase() + tname.slice(1)}
                  </Button>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="motion" className="space-y-3 pt-4">
              <div>
                <Label>{tr("platform")}</Label>
                <Select value={platformId} onValueChange={(v) => setPlatformId(v as typeof platformId)}>
                  <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{tr("format")}</Label>
                <Select value="webm">
                  <SelectTrigger className="mt-2"><SelectValue placeholder="WebM" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="webm">WebM (fast)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <Label>{tr("fps")}</Label>
                  <span className="font-mono text-emerald-400">{fps}</span>
                </div>
                <Slider value={[fps]} min={15} max={60} step={1} onValueChange={([v]) => setFps(v)} />
              </div>
              <p className="text-xs text-muted-foreground">{tr("exportNote")}</p>
            </TabsContent>
            <TabsContent value="audio" className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">🔊 {tr("sfxCompare")}</Label>
                <Select value={sfxCompare} onValueChange={(v) => setSfxCompare(v as SfxKind)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SFX_OPTIONS.map((o) => <SelectItem key={o.id} value={o.id}>{o.label[lang]}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Upload className="w-3 h-3" /> Upload</span>
                  <Button size="sm" variant="outline" onClick={() => audioEngine.playSfx(sfxCompare)}>{tr("test")}</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">🔊 {tr("sfxSwap")}</Label>
                <Select value={sfxSwap} onValueChange={(v) => setSfxSwap(v as SfxKind)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SFX_OPTIONS.map((o) => <SelectItem key={o.id} value={o.id}>{o.label[lang]}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Upload className="w-3 h-3" /> Upload</span>
                  <Button size="sm" variant="outline" onClick={() => audioEngine.playSfx(sfxSwap)}>{tr("test")}</Button>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs w-10">SFX</span>
                  <Slider value={[sfxVol]} min={0} max={100} onValueChange={([v]) => setSfxVol(v)} />
                  <span className="text-xs font-mono w-10 text-right">{sfxVol}%</span>
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t border-border/40">
                <Label className="text-sm">🎵 {tr("bgMusic")}</Label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <Upload className="w-3 h-3" /> {tr("uploadMusic")}
                  <input type="file" accept="audio/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) onMusicUpload(f); }} />
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs w-10">Vol</span>
                  <Slider value={[musicVol]} min={0} max={100} onValueChange={([v]) => setMusicVol(v)} />
                  <span className="text-xs font-mono w-10 text-right">{musicVol}%</span>
                </div>
                <p className="text-xs text-muted-foreground">{tr("audioInVideo")}</p>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Index;
