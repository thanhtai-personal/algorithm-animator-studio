import { Activity, Map, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { AlgorithmStudio } from "@/pages/studio/useAlgorithmStudio";

type Props = { studio: AlgorithmStudio };

export function WorldSetupPanel({ studio: s }: Props) {
  const vars = s.current?.vars ?? {};
  const phase = String(vars.phase ?? "setup");
  const world = s.current?.world;

  return (
    <div className="space-y-4">
      <Card className="space-y-4 border-cyan-400/25 bg-cyan-400/5 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-cyan-400/15 p-2 text-cyan-200">
            <Map className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Algorithm World</p>
            <h2 className="mt-1 text-lg font-bold">A* Shifting Labyrinth</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {s.lang === "vi"
                ? "Page riêng để setup video world/maze: A* mở rộng open set, gặp vật cản realtime rồi replan."
                : "Dedicated world/maze setup: A* expands the open set, hits real-time obstacles, then replans."}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <Metric label="Open" value={vars.open ?? 0} tone="cyan" />
          <Metric label="Closed" value={vars.closed ?? 0} tone="violet" />
          <Metric label="Replans" value={vars.replan ?? 0} tone="rose" />
        </div>
        <Button variant="outline" className="w-full" onClick={() => { s.setPlaying(false); s.setFrameIdx(0); }}>
          <RotateCcw className="mr-2 h-4 w-4" />
          {s.lang === "vi" ? "Reset timeline" : "Reset timeline"}
        </Button>
      </Card>

      <Card className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-300" />
          <Label>{s.lang === "vi" ? "Công thức đang visualize" : "What this visualizes"}</Label>
        </div>
        <div className="rounded-lg border border-border/50 bg-background/60 p-3 font-mono text-xs text-emerald-200">
          f = g + h<br />
          g = {vars.g ?? "—"} &nbsp; h = {vars.h ?? "—"} &nbsp; f = {vars.f ?? "—"}
        </div>
        <p className="text-xs text-muted-foreground">
          {world?.status ?? (s.lang === "vi" ? "Maze đang sẵn sàng." : "Maze is ready.")}
        </p>
      </Card>

      <Card className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-yellow-300" />
          <Label>{s.lang === "vi" ? "Nhịp dựng video" : "Video beat"}</Label>
        </div>
        <div className="space-y-2 text-xs text-muted-foreground">
          <Beat active={phase === "setup"} text="1. Load high-density maze" />
          <Beat active={phase === "search"} text="2. Expand open set" />
          <Beat active={phase === "obstacle"} text="3. Real-time wall breaks the path" />
          <Beat active={phase === "replan"} text="4. Recalculate and pivot" />
          <Beat active={phase === "done"} text="5. Reach goal with rebuilt path" />
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <Label>{s.tr("showCodeInVideo")}</Label>
          <Switch checked={s.showCode} onCheckedChange={s.setShowCode} />
        </div>
        <pre className="max-h-52 overflow-auto rounded-lg border border-border/50 bg-slate-950/60 p-3 text-[11px] text-slate-200">
          {s.codeForPanel}
        </pre>
      </Card>
    </div>
  );
}

function Metric(props: { label: string; value: unknown; tone: "cyan" | "violet" | "rose" }) {
  const toneClass = props.tone === "cyan" ? "text-cyan-200" : props.tone === "violet" ? "text-violet-200" : "text-rose-200";
  return (
    <div className="rounded-lg border border-border/50 bg-background/60 p-2">
      <div className={`font-mono text-lg font-bold ${toneClass}`}>{String(props.value)}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{props.label}</div>
    </div>
  );
}

function Beat({ active, text }: { active: boolean; text: string }) {
  return (
    <div className={active ? "rounded-md bg-emerald-400/10 px-2 py-1 text-emerald-200" : "px-2 py-1"}>
      {text}
    </div>
  );
}
