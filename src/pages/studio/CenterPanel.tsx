import { Download, Pause, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { audioEngine } from "@/lib/audio";
import { AlgorithmStudio } from "./useAlgorithmStudio";

type Props = { studio: AlgorithmStudio };

export function CenterPanel({ studio: s }: Props) {
  return (
    <div className="flex flex-col items-center gap-4">
      <Card className="p-3 bg-card/50">
        <canvas
          ref={s.canvasRef}
          width={s.W}
          height={s.H}
          className="rounded-lg w-auto"
          style={{ maxHeight: "70vh", aspectRatio: `${s.W}/${s.H}` }}
        />
      </Card>
      <Card className="w-full max-w-2xl p-4 space-y-3">
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => { audioEngine.resume(); s.setPlaying((p) => !p); }} disabled={s.exporting}>
            {s.playing ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {s.playing ? s.tr("pause") : s.tr("play")}
          </Button>
          <Button variant="outline" size="icon" onClick={() => { s.setPlaying(false); s.setFrameIdx(0); }}>
            <Square className="w-4 h-4" />
          </Button>
          <Button onClick={s.requestExport} disabled={s.exporting} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-900">
            <Download className="w-4 h-4 mr-2" />
            {s.exporting ? `${s.tr("exporting")} ${s.exportProgress}%` : s.tr("exportVideo")}
          </Button>
        </div>
        <Slider
          value={[s.frameIdx]}
          min={0}
          max={Math.max(0, s.frames.length - 1)}
          step={1}
          onValueChange={([v]) => { s.setFrameIdx(v); s.setPlaying(false); }}
        />
        <div className="flex justify-between text-xs text-muted-foreground font-mono">
          <span>Frame {s.frameIdx + 1} / {s.frames.length}</span>
          <span>{s.W}×{s.H}</span>
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-xs whitespace-nowrap">{s.tr("speed")}</Label>
          <Slider value={[s.speed]} min={0.1} max={3} step={0.1} onValueChange={([v]) => s.setSpeed(v)} />
          <span className="font-mono text-xs w-10 text-right">{s.speed}x</span>
        </div>
      </Card>
    </div>
  );
}
