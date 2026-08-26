import { Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MarbleTowerTransportBarProps {
  playing: boolean;
  recording: boolean;
  timeMs: number;
  durationMs: number;
  onToggle: () => void;
  onReset: () => void;
  onSeek: (timeMs: number) => void;
}

function formatClock(timeMs: number) {
  const totalSeconds = Math.max(0, Math.floor(timeMs / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function MarbleTowerTransportBar({
  playing,
  recording,
  timeMs,
  durationMs,
  onToggle,
  onReset,
  onSeek,
}: MarbleTowerTransportBarProps) {
  const duration = Math.max(1, durationMs);
  const current = Math.min(duration, Math.max(0, timeMs));

  return (
    <div
      className="flex min-h-16 flex-wrap items-center gap-3 border-t border-white/10 bg-slate-950/95 px-3 py-2.5 text-white md:flex-nowrap md:px-4"
      data-testid="marble-tower-transport"
    >
      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          size="sm"
          className="min-w-24 bg-cyan-500 font-semibold text-slate-950 hover:bg-cyan-400"
          disabled={recording}
          aria-label={playing ? "Pause race" : "Play race"}
          onClick={onToggle}
        >
          {playing ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
          {playing ? "Pause" : "Play"}
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="text-slate-200 hover:bg-white/10 hover:text-white"
          disabled={recording}
          aria-label="Reset race"
          title="Reset race"
          onClick={onReset}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <div className="order-3 flex min-w-0 basis-full items-center gap-3 md:order-none md:basis-auto md:flex-1">
        <input
          type="range"
          className="h-2 min-w-0 flex-1 cursor-pointer accent-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          min={0}
          max={duration}
          step={50}
          value={current}
          disabled={recording}
          aria-label="Race timeline"
          onChange={(event) => onSeek(Number(event.currentTarget.value))}
        />
      </div>

      <output className="ml-auto shrink-0 text-xs font-medium tabular-nums text-slate-300" aria-live="off">
        {formatClock(current)} / {formatClock(duration)}
      </output>
    </div>
  );
}
