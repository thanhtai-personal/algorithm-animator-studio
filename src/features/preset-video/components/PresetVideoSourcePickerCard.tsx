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
};

const ACCEPTED_VIDEO_TYPES = ".mp4,.mov,.mkv,.webm,.avi,.m4v,video/*";

export function PresetVideoSourcePickerCard(props: Props) {
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
          chuyển H.264 và cache clip để preview/render lần sau không cần YouTube.
        </p>

        {props.sources.map((source, index) => {
          const isReady = Boolean(props.videoSourceUrls[source.id]);
          const isUploading = props.uploadingSourceId === source.id;
          const inputId = `preset-source-${source.id}-${index}`;
          return (
            <div key={source.id} className="space-y-2 rounded-lg border bg-muted/20 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{source.title}</p>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                    Cắt {formatSeconds(source.clipStartSeconds)} → {formatSeconds(source.clipEndSeconds)}
                    {" · "}{formatSeconds(source.clipEndSeconds - source.clipStartSeconds)}
                  </p>
                </div>
                <div className={`flex shrink-0 items-center gap-1 text-xs ${isReady ? "text-emerald-400" : "text-amber-400"}`}>
                  {isUploading
                    ? <SystemLoader className="h-3.5 w-3.5" />
                    : isReady
                      ? <CheckCircle2 className="h-3.5 w-3.5" />
                      : <Upload className="h-3.5 w-3.5" />}
                  {isUploading ? "Đang xử lý" : isReady ? "Đã cache" : "Chưa chọn"}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={source.watchUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2 h-3.5 w-3.5" />
                    Mở video nguồn
                  </a>
                </Button>

                <input
                  id={inputId}
                  type="file"
                  accept={ACCEPTED_VIDEO_TYPES}
                  className="hidden"
                  disabled={props.disabled || Boolean(props.uploadingSourceId)}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) props.onSelect(source, file);
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
                  {isReady ? "Thay video" : "Chọn video local"}
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function formatSeconds(value: number) {
  const safe = Math.max(0, Number.isFinite(value) ? value : 0);
  const minutes = Math.floor(safe / 60);
  const seconds = safe - minutes * 60;
  return `${String(minutes).padStart(2, "0")}:${seconds.toFixed(1).padStart(4, "0")}`;
}
