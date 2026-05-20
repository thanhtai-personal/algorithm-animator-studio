import type React from "react";
import { Activity, Flag, GitCompare, Map, RotateCcw, Route, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { WORLD_ALGORITHMS } from "@/lib/algorithmWorld";
import type { AlgorithmWorldAlgorithmId, AlgorithmWorldProblemType, AlgorithmWorldVideoMode } from "@/lib/algorithms";
import type { AlgorithmStudio } from "@/pages/studio/useAlgorithmStudio";

type Props = { studio: AlgorithmStudio };

export function WorldSetupPanel({ studio: s }: Props) {
  const vars = s.current?.vars ?? {};
  const world = s.current?.world ?? s.current?.worldCompare?.left;
  const phase = String(world?.phase ?? vars.phase ?? "setup");
  const isLong = s.worldVideoMode === "long";

  return (
    <div className="space-y-4">
      <Card className="space-y-4 border-cyan-400/25 bg-cyan-400/5 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-cyan-400/15 p-2 text-cyan-200"><Map className="h-5 w-5" /></div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Algorithm World</p>
            <h2 className="mt-1 text-lg font-bold">Maze Pathfinding Lab</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {s.lang === "vi"
                ? "World mode mô phỏng thuật toán tìm đường từ lối vào đến lối ra, có vật cản realtime."
                : "World mode simulates pathfinding from entrance to exit with real-time obstacles."}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <Metric label="Open" value={vars.open ?? 0} tone="cyan" />
          <Metric label="Visited" value={vars.visited ?? 0} tone="violet" />
          <Metric label="Replans" value={vars.replan ?? 0} tone="rose" />
        </div>
        <Button variant="outline" className="w-full" onClick={() => { s.setPlaying(false); s.setFrameIdx(0); }}>
          <RotateCcw className="mr-2 h-4 w-4" /> Reset timeline
        </Button>
      </Card>

      <Card className="space-y-3 p-4">
        <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-yellow-300" /><Label>{s.lang === "vi" ? "Mode video" : "Video mode"}</Label></div>
        <div className="grid grid-cols-2 gap-2">
          <ModeButton active={!isLong} icon={<Route className="h-4 w-4" />} title="Short" desc="1 algorithm" onClick={() => s.setWorldVideoMode("short")} />
          <ModeButton active={isLong} icon={<GitCompare className="h-4 w-4" />} title="Long 16:9" desc="2 algorithms" onClick={() => s.setWorldVideoMode("long")} />
        </div>
        <p className="text-xs text-muted-foreground">
          {isLong
            ? "Long mode renders two algorithms side by side on one 16:9 screen for comparison."
            : "Short mode renders one algorithm as a vertical Shorts/Reels visualization."}
        </p>
      </Card>

      <Card className="space-y-3 p-4">
        <div className="flex items-center gap-2"><Flag className="h-4 w-4 text-emerald-300" /><Label>{s.lang === "vi" ? "Kiểu bài toán" : "Problem type"}</Label></div>
        <div className="grid grid-cols-2 gap-2">
          <ModeButton active={s.worldProblemType === "escape"} title="Find exit" desc="có đường ra" onClick={() => s.setWorldProblemType("escape")} />
          <ModeButton active={s.worldProblemType === "fastest"} title="Fastest path" desc="đường ngắn/nhanh" onClick={() => s.setWorldProblemType("fastest")} />
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-emerald-300" /><Label>{s.lang === "vi" ? "Thuật toán build được" : "Buildable algorithms"}</Label></div>
        <AlgorithmSelect label={isLong ? "Left" : "Algorithm"} value={s.worldPrimaryAlgorithm} onChange={s.setWorldPrimaryAlgorithm} problemType={s.worldProblemType} />
        {isLong ? <AlgorithmSelect label="Right" value={s.worldSecondaryAlgorithm} onChange={s.setWorldSecondaryAlgorithm} problemType={s.worldProblemType} /> : null}
        <div className="space-y-2 pt-1">
          {WORLD_ALGORITHMS.map((item) => (
            <div key={item.id} className="rounded-lg border border-border/50 bg-background/60 p-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-foreground">{item.name}</span>
                <span className="font-mono text-yellow-300">{item.runtime}</span>
              </div>
              <p className="mt-1 text-muted-foreground">{item.note}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-yellow-300" /><Label>{s.lang === "vi" ? "Nhịp dựng video" : "Video beat"}</Label></div>
        <div className="space-y-2 text-xs text-muted-foreground">
          <Beat active={phase === "setup"} text="1. Load maze entrance and exit" />
          <Beat active={phase === "search"} text="2. Expand frontier/open set" />
          <Beat active={phase === "obstacle"} text="3. Real-time wall breaks old route" />
          <Beat active={phase === "replan"} text="4. Recalculate from current position" />
          <Beat active={phase === "done"} text="5. Show final entrance → exit path" />
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between"><Label>{s.tr("showCodeInVideo")}</Label><Switch checked={s.showCode} onCheckedChange={s.setShowCode} /></div>
        <pre className="max-h-52 overflow-auto rounded-lg border border-border/50 bg-slate-950/60 p-3 text-[11px] text-slate-200">{s.codeForPanel}</pre>
      </Card>
    </div>
  );
}

function AlgorithmSelect(props: {
  label: string;
  value: AlgorithmWorldAlgorithmId;
  problemType: AlgorithmWorldProblemType;
  onChange: (value: AlgorithmWorldAlgorithmId) => void;
}) {
  return (
    <div>
      <Label className="text-xs">{props.label}</Label>
      <Select value={props.value} onValueChange={(value) => props.onChange(value as AlgorithmWorldAlgorithmId)}>
        <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
        <SelectContent>
          {WORLD_ALGORITHMS.map((item) => {
            const recommended = item.taskFit.includes(props.problemType);
            return <SelectItem key={item.id} value={item.id}>{item.name} · {item.runtime}{recommended ? "" : " · not ideal"}</SelectItem>;
          })}
        </SelectContent>
      </Select>
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

function ModeButton(props: { active: boolean; title: string; desc: string; icon?: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={`rounded-lg border p-3 text-left text-xs transition ${props.active ? "border-emerald-300 bg-emerald-400/10 text-emerald-100" : "border-border/60 bg-background/60 text-muted-foreground hover:bg-muted/40"}`}
    >
      <div className="flex items-center gap-2 font-semibold">{props.icon}{props.title}</div>
      <div className="mt-1 opacity-80">{props.desc}</div>
    </button>
  );
}

function Beat({ active, text }: { active: boolean; text: string }) {
  return <div className={active ? "rounded-md bg-emerald-400/10 px-2 py-1 text-emerald-200" : "px-2 py-1"}>{text}</div>;
}
