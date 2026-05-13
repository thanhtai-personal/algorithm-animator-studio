import { ArrowLeft, Download, Film, Pause, Play, RefreshCcw, Youtube } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ALGORITHMS, ALGO_GROUPS, COMPLEXITY } from "@/lib/algorithms";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { THEMES } from "@/lib/renderer";
import { EXPORT_FORMATS, ExportFormat } from "./studio/exportFormats";
import { LongContentStudio, useLongContentStudio } from "./long-content/useLongContentStudio";

export default function LongContent() {
  const navigate = useNavigate();
  const studio = useLongContentStudio();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center gap-3 border-b border-border/40 px-6 py-5">
        <Button variant="outline" size="icon" onClick={() => navigate("/") } aria-label="Về studio short">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-amber-400">
          <Youtube className="h-6 w-6 text-slate-950" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Long Content Studio</h1>
          <p className="text-xs text-muted-foreground">Sản xuất video YouTube 16:9 giải thích thuật toán bằng animation chi tiết.</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/")}>Short Studio</Button>
      </header>

      <main className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-[360px_1fr_360px]">
        <LeftControls studio={studio} />
        <PreviewPanel studio={studio} />
        <ScriptPanel studio={studio} />
      </main>
    </div>
  );
}

function LeftControls({ studio: s }: { studio: LongContentStudio }) {
  return (
    <div className="space-y-4">
      <Card className="space-y-4 p-4">
        <div className="flex items-center gap-2">
          <Film className="h-4 w-4 text-emerald-400" />
          <h2 className="font-semibold">Cấu hình nội dung</h2>
        </div>
        <div>
          <Label>Thuật toán</Label>
          <Select value={s.algoId} onValueChange={s.setAlgoId}>
            <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ALGO_GROUPS.map((group, index) => (
                <div key={group.label.en}>
                  {index > 0 && <SelectSeparator />}
                  <SelectGroup>
                    <SelectLabel className="bg-emerald-500/10 text-[11px] uppercase tracking-wider text-emerald-300">
                      {group.label.vi}
                    </SelectLabel>
                    {group.ids.map((id) => <SelectItem key={id} value={id}>{ALGORITHMS[id].name}</SelectItem>)}
                  </SelectGroup>
                </div>
              ))}
            </SelectContent>
          </Select>
          {COMPLEXITY[s.algoId] ? <ComplexityBadges algoId={s.algoId} /> : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <NumberSlider label="Intro" value={s.introSeconds} min={3} max={10} suffix="s" onChange={s.setIntroSeconds} />
          <NumberSlider label="Animation" value={s.animationSeconds} min={12} max={90} suffix="s" onChange={s.setAnimationSeconds} />
        </div>
        <NumberSlider label="FPS export" value={s.fps} min={15} max={60} suffix="fps" onChange={s.setFps} />

        <div>
          <Label>Theme</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.keys(THEMES).map((name) => (
              <Button key={name} size="sm" variant={s.themeName === name ? "default" : "outline"} onClick={() => s.setThemeName(name as keyof typeof THEMES)}>
                {name[0].toUpperCase() + name.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="space-y-4 p-4">
        <h2 className="font-semibold">Visual & export</h2>
        <div>
          <Label>Tỉ lệ video</Label>
          <div className="mt-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
            YouTube long video · 16:9 · 1920×1080
          </div>
        </div>
        <div>
          <Label>Định dạng</Label>
          <Select value={s.exportFormat} onValueChange={(v) => s.setExportFormat(v as ExportFormat)}>
            <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              {EXPORT_FORMATS.map((format) => <SelectItem key={format.id} value={format.id}>{format.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
          <Label>Hiện code trong animation</Label>
          <Switch checked={s.showCode} onCheckedChange={s.setShowCode} />
        </div>
        {s.algo.category === "sort" ? <AnimalControls studio={s} /> : null}
        <Button className="w-full bg-emerald-500 text-slate-950 hover:bg-emerald-600" onClick={s.exportVideo} disabled={s.exporting}>
          <Download className="mr-2 h-4 w-4" />
          {s.exporting ? `Đang xuất ${s.exportProgress}%` : "Xuất long video 16:9"}
        </Button>
      </Card>
    </div>
  );
}

function PreviewPanel({ studio: s }: { studio: LongContentStudio }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <Card className="w-full p-3">
        <canvas
          ref={s.canvasRef}
          width={s.W}
          height={s.H}
          className="mx-auto rounded-xl border border-border/60 bg-slate-950"
          style={{ width: "100%", maxHeight: "72vh", aspectRatio: "16 / 9" }}
        />
      </Card>
      <Card className="w-full max-w-4xl space-y-3 p-4">
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => s.setPlaying(!s.playing)} disabled={s.exporting}>
            {s.playing ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
            {s.playing ? "Tạm dừng" : "Preview"}
          </Button>
          <Button variant="outline" onClick={() => { s.setPlaying(false); s.setElapsedSec(0); }}>
            <RefreshCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
        </div>
        <Slider value={[s.elapsedSec]} min={0} max={s.totalDuration} step={0.1} onValueChange={([value]) => { s.setPlaying(false); s.setElapsedSec(value); }} />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{s.timelineState.scene.title}</span>
          <span>Frame {s.frameIdx + 1}/{s.frames.length} · Tổng thời lượng {Math.round(s.totalDuration)}s</span>
        </div>
      </Card>
    </div>
  );
}

function ScriptPanel({ studio: s }: { studio: LongContentStudio }) {
  return (
    <Card className="h-fit space-y-4 p-4">
      <div>
        <h2 className="font-semibold">Kịch bản long content</h2>
        <p className="text-xs text-muted-foreground">Mỗi scene sẽ được render thành overlay chữ + animation 16:9.</p>
      </div>
      <div className="space-y-3">
        {s.scenes.map((scene, index) => (
          <div key={scene.id} className={`rounded-lg border p-3 ${s.timelineState.scene.id === scene.id ? "border-emerald-400 bg-emerald-400/10" : "border-border bg-card/50"}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">{index + 1}. {scene.title}</p>
              <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs text-muted-foreground">{scene.durationSec}s</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{scene.subtitle}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
              {scene.bullets.slice(0, 3).map((bullet) => <li key={bullet}>{bullet}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ComplexityBadges({ algoId }: { algoId: string }) {
  const item = COMPLEXITY[algoId];
  if (!item) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-mono">
      <span className="rounded border border-yellow-400/30 bg-yellow-400/15 px-2 py-0.5 text-yellow-300">Time {item.time}</span>
      {item.best && item.best !== item.time ? <span className="rounded border border-emerald-400/30 bg-emerald-400/15 px-2 py-0.5 text-emerald-300">Best {item.best}</span> : null}
      {item.worst && item.worst !== item.time ? <span className="rounded border border-rose-400/30 bg-rose-400/15 px-2 py-0.5 text-rose-300">Worst {item.worst}</span> : null}
      <span className="rounded border border-cyan-400/30 bg-cyan-400/15 px-2 py-0.5 text-cyan-300">Space {item.space}</span>
    </div>
  );
}

function NumberSlider(props: { label: string; value: number; min: number; max: number; suffix: string; step?: number; onChange: (value: number) => void }) {
  return (
    <div>
      <div className="mb-2 flex justify-between gap-2">
        <Label>{props.label}</Label>
        <span className="font-mono text-xs text-emerald-400">{props.value}{props.suffix}</span>
      </div>
      <Slider value={[props.value]} min={props.min} max={props.max} step={props.step ?? 1} onValueChange={([value]) => props.onChange(value)} />
    </div>
  );
}

function AnimalControls({ studio: s }: { studio: LongContentStudio }) {
  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <div>
        <Label>Kiểu cột</Label>
        <Select value={s.columnVisualMode} onValueChange={(value) => s.setColumnVisualMode(value as typeof s.columnVisualMode)}>
          <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="bar">Cột thường</SelectItem>
            <SelectItem value="animal">Animal columns</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {s.columnVisualMode === "animal" ? (
        <>
          <NumberSlider label="Sprite" value={s.animalSpriteScale} min={0.6} max={1.6} suffix="x" step={0.1} onChange={s.setAnimalSpriteScale} />
          <NumberSlider label="Độ nhảy" value={s.animalJumpIntensity} min={0.4} max={1.8} suffix="x" step={0.1} onChange={s.setAnimalJumpIntensity} />
          <div className="flex items-center justify-between">
            <Label>Highlight cũng nhảy</Label>
            <Switch checked={s.animalHighlightJump} onCheckedChange={s.setAnimalHighlightJump} />
          </div>
        </>
      ) : null}
    </div>
  );
}
