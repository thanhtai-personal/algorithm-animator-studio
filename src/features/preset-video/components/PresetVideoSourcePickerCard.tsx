import { CheckCircle2, ExternalLink, Upload, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SystemLoader } from "@/components/ui/system-loader";
import type { PresetVideoSourceClip } from "../types";

type Props = {
  sources: readonly PresetVideoSourceClip[];
  videoSourceUrls: Record<string, string>;
  uploadingSourceId: string;
  disabled?: boolean;
  onSelect: (source: PresetVideoSourceClip, file: File) => void;
  onSelectMany?: (sources: readonly PresetVideoSourceClip[], file: File) => void;
};

const ACCEPTED_VIDEO_TYPES = ".mp4,.mov,.mkv,.webm,.avi,.m4v,video/*";

export function PresetVideoSourcePickerCard(props: Props) {
  const groups = groupSources(props.sources);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Video className="h-4 w-4" />
          Video nguồn local
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs leading-5 text-muted-foreground">
          Chọn video đầy đủ đã tải về. KAI Studio tự cắt đúng đoạn cấu hình, bỏ audio nguồn,
          chuyển H.264 và cache clip để preview/render lần sau.
        </p>

        {groups.map((group, index) => (
          <SourceGroup
            key={group.id}
            group={group}
            index={index}
            videoSourceUrls={props.videoSourceUrls}
            uploadingSourceId={props.uploadingSourceId}
            disabled={props.disabled}
            onSelect={props.onSelect}
            onSelectMany={props.onSelectMany}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function SourceGroup(props: {
  group: { id: string; sources: readonly PresetVideoSourceClip[] };
  index: number;
  videoSourceUrls: Record<string, string>;
  uploadingSourceId: string;
  disabled?: boolean;
  onSelect: Props["onSelect"];
  onSelectMany?: Props["onSelectMany"];
}) {
  const { sources } = props.group;
  const isGrouped = sources.length > 1;
  const isReady = sources.every((source) => Boolean(props.videoSourceUrls[source.id]));
  const isUploading = sources.some((source) => source.id === props.uploadingSourceId);
  const inputId = `preset-source-group-${props.group.id}-${props.index}`;
  const firstSource = sources[0];

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {isGrouped
              ? firstSource.sourceGroupLabel || `${sources.length} trích đoạn · 1 video nguồn`
              : firstSource.title}
          </p>
          <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
            {isGrouped
              ? `${sources.length} trích đoạn · chọn video gốc một lần, KAI Studio tự cắt toàn bộ đoạn bên dưới.`
              : `${formatSeconds(firstSource.clipStartSeconds)} → ${formatSeconds(firstSource.clipEndSeconds)}`}
          </p>
        </div>
        <SourceStatus ready={isReady} uploading={isUploading} />
      </div>

      {isGrouped ? (
        <div className="grid gap-1.5 rounded-md bg-background/60 p-2">
          {sources.map((source) => (
            <div key={source.id} className="flex items-center justify-between gap-3 text-[11px]">
              <span className="truncate text-muted-foreground">{source.title}</span>
              <span className="shrink-0 font-mono text-muted-foreground">
                {formatSeconds(source.clipStartSeconds)}–{formatSeconds(source.clipEndSeconds)}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {firstSource.watchUrl ? (
          <Button variant="outline" size="sm" asChild>
            <a href={firstSource.watchUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-3.5 w-3.5" />
              Mở video nguồn
            </a>
          </Button>
        ) : null}

        <input
          id={inputId}
          type="file"
          accept={ACCEPTED_VIDEO_TYPES}
          className="hidden"
          disabled={props.disabled || Boolean(props.uploadingSourceId)}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            if (isGrouped && props.onSelectMany) props.onSelectMany(sources, file);
            else props.onSelect(firstSource, file);
          }}
        />
        <Button
          variant={isReady ? "secondary" : "default"}
          size="sm"
          type="button"
          disabled={props.disabled || Boolean(props.uploadingSourceId)}
          onClick={() => document.getElementById(inputId)?.click()}
        >
          <Upload className="mr-2 h-3.5 w-3.5" />
          {isReady ? "Thay video" : isGrouped ? "Chọn video cho tất cả" : "Chọn video local"}
        </Button>
      </div>
    </div>
  );
}

function SourceStatus({ ready, uploading }: { ready: boolean; uploading: boolean }) {
  return (
    <div className={`flex shrink-0 items-center gap-1 text-xs ${ready ? "text-emerald-400" : "text-amber-400"}`}>
      {uploading
        ? <SystemLoader className="h-3.5 w-3.5" />
        : ready
          ? <CheckCircle2 className="h-3.5 w-3.5" />
          : <Upload className="h-3.5 w-3.5" />}
      {uploading ? "Đang xử lý" : ready ? "Đã cache" : "Chưa chọn"}
    </div>
  );
}

function groupSources(sources: readonly PresetVideoSourceClip[]) {
  const grouped = new Map<string, PresetVideoSourceClip[]>();
  for (const source of sources) {
    const key = source.sourceGroupId || `source:${source.id}`;
    const current = grouped.get(key) || [];
    current.push(source);
    grouped.set(key, current);
  }
  return [...grouped.entries()].map(([id, items]) => ({ id, sources: items }));
}

function formatSeconds(value: number) {
  const safe = Math.max(0, Number.isFinite(value) ? value : 0);
  const minutes = Math.floor(safe / 60);
  const seconds = safe - minutes * 60;
  return `${String(minutes).padStart(2, "0")}:${seconds.toFixed(1).padStart(4, "0")}`;
}
