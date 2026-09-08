import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Film, Play, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SystemLoader } from "@/components/ui/system-loader";
import type { PresetVideoTimelineClip } from "../types";

type Props = {
  clips: readonly PresetVideoTimelineClip[];
  videoSourceUrls: Record<string, string>;
  uploadingSourceId: string;
  durationSeconds: number;
  disabled?: boolean;
  onAdd: () => void;
  onRemove: (clipId: string) => void;
  onChange: (clipId: string, patch: Partial<PresetVideoTimelineClip>) => void;
  onSelect: (clip: PresetVideoTimelineClip, file: File) => void;
  onPreview: (timeSeconds: number) => void;
};

const MAX_CUSTOM_CLIPS = 20;
const ACCEPTED_VIDEO_TYPES = ".mp4,.mov,.mkv,.webm,.avi,.m4v,video/*";

export function PresetVideoCustomClipsCard(props: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Film className="h-4 w-4" />
              Đoạn video bổ sung
            </CardTitle>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Thêm tối đa {MAX_CUSTOM_CLIPS} đoạn. Chọn phần cần cắt trong file và thời điểm đoạn đó xuất hiện trên timeline bài hát.
              Đổi khoảng cắt nguồn sẽ cần chọn lại file; đổi timeline thì không.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={props.disabled || Boolean(props.uploadingSourceId) || props.clips.length >= MAX_CUSTOM_CLIPS}
            onClick={props.onAdd}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Thêm đoạn
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {props.clips.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
            Chưa có đoạn custom. Thêm một đoạn rồi chọn video local để KAI Studio tự cắt/cache.
          </p>
        ) : null}

        {props.clips.map((clip, index) => (
          <CustomClipRow
            key={clip.id}
            clip={clip}
            index={index}
            isReady={Boolean(props.videoSourceUrls[clip.id])}
            isUploading={props.uploadingSourceId === clip.id}
            disabled={props.disabled || Boolean(props.uploadingSourceId)}
            durationSeconds={props.durationSeconds}
            onChange={(patch) => props.onChange(clip.id, patch)}
            onRemove={() => props.onRemove(clip.id)}
            onSelect={(file) => props.onSelect(clip, file)}
            onPreview={() => props.onPreview(clip.timelineStartSeconds)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function CustomClipRow(props: {
  clip: PresetVideoTimelineClip;
  index: number;
  isReady: boolean;
  isUploading: boolean;
  disabled: boolean;
  durationSeconds: number;
  onChange: (patch: Partial<PresetVideoTimelineClip>) => void;
  onRemove: () => void;
  onSelect: (file: File) => void;
  onPreview: () => void;
}) {
  const sourceDuration = props.clip.clipEndSeconds - props.clip.clipStartSeconds;
  const maxTimelineEnd = Math.min(
    props.durationSeconds,
    props.clip.timelineStartSeconds + Math.max(0.1, sourceDuration),
  );
  const inputId = `preset-custom-clip-${props.clip.id}-${props.index}`;

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{props.clip.title || `Video ${props.index + 1}`}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Timeline {formatSeconds(props.clip.timelineStartSeconds)} → {formatSeconds(props.clip.timelineEndSeconds)}
          </p>
        </div>
        <div className={`flex shrink-0 items-center gap-1 text-xs ${props.isReady ? "text-emerald-400" : "text-amber-400"}`}>
          {props.isUploading
            ? <SystemLoader className="h-3.5 w-3.5" />
            : props.isReady
              ? <CheckCircle2 className="h-3.5 w-3.5" />
              : <Upload className="h-3.5 w-3.5" />}
          {props.isUploading ? "Đang cắt" : props.isReady ? "Đã cache" : "Cần chọn file"}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <TimeRangeFields
          label="Cắt trong file"
          start={props.clip.clipStartSeconds}
          end={props.clip.clipEndSeconds}
          startMin={0}
          startMax={Math.max(0, props.clip.clipEndSeconds - 0.5)}
          endMin={props.clip.clipStartSeconds + 0.5}
          endMax={props.clip.clipStartSeconds + 20}
          onStart={(clipStartSeconds) => {
            const maxEnd = clipStartSeconds + 20;
            const clipEndSeconds = Math.max(clipStartSeconds + 0.5, Math.min(props.clip.clipEndSeconds, maxEnd));
            const maxTimelineEnd = Math.min(
              props.durationSeconds,
              props.clip.timelineStartSeconds + clipEndSeconds - clipStartSeconds,
            );
            props.onChange({
              clipStartSeconds,
              clipEndSeconds,
              timelineEndSeconds: Math.min(props.clip.timelineEndSeconds, maxTimelineEnd),
            });
          }}
          onEnd={(clipEndSeconds) => {
            const maxTimelineEnd = Math.min(
              props.durationSeconds,
              props.clip.timelineStartSeconds + clipEndSeconds - props.clip.clipStartSeconds,
            );
            props.onChange({
              clipEndSeconds,
              timelineEndSeconds: Math.min(props.clip.timelineEndSeconds, maxTimelineEnd),
            });
          }}
        />
        <TimeRangeFields
          label="Phát trên timeline"
          start={props.clip.timelineStartSeconds}
          end={props.clip.timelineEndSeconds}
          startMin={0}
          startMax={Math.max(0, props.durationSeconds - 0.1)}
          endMin={props.clip.timelineStartSeconds + 0.1}
          endMax={Math.max(props.clip.timelineStartSeconds + 0.1, maxTimelineEnd)}
          onStart={(timelineStartSeconds) => {
            const currentDuration = Math.min(sourceDuration, props.clip.timelineEndSeconds - props.clip.timelineStartSeconds);
            const timelineEndSeconds = Math.min(
              props.durationSeconds,
              timelineStartSeconds + Math.max(0.1, currentDuration),
            );
            props.onChange({ timelineStartSeconds, timelineEndSeconds });
          }}
          onEnd={(timelineEndSeconds) => props.onChange({ timelineEndSeconds })}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={props.onPreview}>
          <Play className="mr-1.5 h-3.5 w-3.5" />
          Xem tại timeline
        </Button>
        <input
          id={inputId}
          type="file"
          accept={ACCEPTED_VIDEO_TYPES}
          className="hidden"
          disabled={props.disabled}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) props.onSelect(file);
          }}
        />
        <Button
          type="button"
          size="sm"
          variant={props.isReady ? "secondary" : "default"}
          disabled={props.disabled}
          onClick={() => document.getElementById(inputId)?.click()}
        >
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          {props.isReady ? "Thay file" : "Chọn video"}
        </Button>
        <Button type="button" size="sm" variant="ghost" disabled={props.disabled} onClick={props.onRemove}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Xóa
        </Button>
      </div>
    </div>
  );
}

function TimeRangeFields(props: {
  label: string;
  start: number;
  end: number;
  startMin: number;
  startMax: number;
  endMin: number;
  endMax: number;
  onStart: (value: number) => void;
  onEnd: (value: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{props.label}</Label>
      <div className="grid grid-cols-2 gap-2">
        <TimeInput value={props.start} min={props.startMin} max={props.startMax} ariaLabel={`${props.label} bắt đầu`} onCommit={props.onStart} />
        <TimeInput value={props.end} min={props.endMin} max={props.endMax} ariaLabel={`${props.label} kết thúc`} onCommit={props.onEnd} />
      </div>
    </div>
  );
}

function TimeInput(props: {
  value: number;
  min: number;
  max: number;
  ariaLabel: string;
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

  const commit = () => {
    const parsed = Number(draft.trim().replace(",", "."));
    if (!Number.isFinite(parsed) || parsed < props.min || parsed > props.max) {
      setInvalid(true);
      return;
    }
    const value = Math.round(parsed * 1000) / 1000;
    lastValue.current = value;
    setDraft(formatInput(value));
    setInvalid(false);
    props.onCommit(value);
  };

  return (
    <Input
      aria-label={props.ariaLabel}
      aria-invalid={invalid || undefined}
      inputMode="decimal"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
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
  return `${String(minutes).padStart(2, "0")}:${seconds.toFixed(1).padStart(4, "0")}`;
}
