import { useEffect, useRef, useState } from "react";
import { Captions, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type {
  PresetVideoEditableLyricCue,
  PresetVideoLyricTiming,
} from "../types";

type Props = {
  cues: readonly PresetVideoEditableLyricCue[];
  timings: Record<string, PresetVideoLyricTiming>;
  durationSeconds: number;
  onChange: (cueId: string, timing: PresetVideoLyricTiming) => void;
  onReset: () => void;
  onPreview: (timeSeconds: number) => void;
};

export function PresetLyricTimingEditor({
  cues,
  timings,
  durationSeconds,
  onChange,
  onReset,
  onPreview,
}: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Captions className="h-4 w-4" />
              Timing lyric
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Sửa chính xác thời điểm caption xuất hiện/kết thúc. Thay đổi được dùng chung cho preview và MP4 export.
            </p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={onReset}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset timing
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-[42vh] space-y-2 overflow-y-auto pr-1">
          {cues.map((cue, index) => {
            const timing = timings[cue.id] || cue;
            return (
              <div
                key={cue.id}
                className="grid gap-2 rounded-lg border bg-muted/20 p-2 md:grid-cols-[42px_108px_108px_minmax(0,1fr)] md:items-center"
              >
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  aria-label={`Preview lyric ${index + 1}`}
                  onClick={() => onPreview(timing.start)}
                >
                  <Play className="h-3.5 w-3.5" />
                </Button>
                <CueTimeInput
                  ariaLabel={`Lyric ${index + 1} start`}
                  value={timing.start}
                  min={0}
                  max={Math.max(0, timing.end - 0.05)}
                  onCommit={(start) => onChange(cue.id, { start, end: timing.end })}
                />
                <CueTimeInput
                  ariaLabel={`Lyric ${index + 1} end`}
                  value={timing.end}
                  min={Math.min(durationSeconds, timing.start + 0.05)}
                  max={durationSeconds}
                  onCommit={(end) => onChange(cue.id, { start: timing.start, end })}
                />
                <div className="min-w-0 text-sm">
                  <p className="truncate font-medium">{cue.lines.join(" / ")}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatSeconds(timing.start)} → {formatSeconds(timing.end)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function CueTimeInput(props: {
  ariaLabel: string;
  value: number;
  min: number;
  max: number;
  onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = useState(() => formatInput(props.value));
  const [invalid, setInvalid] = useState(false);
  const lastValue = useRef(props.value);

  useEffect(() => {
    if (Object.is(lastValue.current, props.value)) return;
    lastValue.current = props.value;
    setDraft(formatInput(props.value));
    setInvalid(false);
  }, [props.value]);

  function commit() {
    const parsed = Number(draft.trim().replace(",", "."));
    if (!Number.isFinite(parsed) || parsed < props.min || parsed > props.max) {
      setInvalid(true);
      return;
    }
    const rounded = Math.round(parsed * 1000) / 1000;
    lastValue.current = rounded;
    setDraft(formatInput(rounded));
    setInvalid(false);
    props.onCommit(rounded);
  }

  return (
    <Input
      aria-label={props.ariaLabel}
      aria-invalid={invalid || undefined}
      inputMode="decimal"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }
      }}
      className={invalid ? "border-destructive" : ""}
    />
  );
}

function formatInput(value: number) {
  return value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function formatSeconds(value: number) {
  const minutes = Math.floor(Math.max(0, value) / 60);
  const seconds = Math.max(0, value) - minutes * 60;
  return `${String(minutes).padStart(2, "0")}:${seconds.toFixed(2).padStart(5, "0")}`;
}
