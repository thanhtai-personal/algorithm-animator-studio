import { Video } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SystemLoader } from "@/components/ui/system-loader";

export function PresetVideoMediaStatusCard(props: {
  preparing: boolean;
  error: string;
  sourceCount: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        {props.preparing
          ? <SystemLoader className="mt-0.5 h-5 w-5 shrink-0" />
          : <Video className="mt-0.5 h-5 w-5 shrink-0" />}
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {props.preparing
              ? "Đang chuẩn bị video background"
              : props.error
                ? "Video background chưa sẵn sàng"
                : `${props.sourceCount} clip video background`}
          </p>
          <p className={`mt-1 break-words text-xs ${props.error ? "text-destructive" : "text-muted-foreground"}`}>
            {props.error || "Clip nguồn được tải theo đoạn ngắn, bỏ audio nguồn và cache để preview/render dùng lại."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function PresetVideoRenderProgressCard(props: {
  progress: number;
  message: string;
}) {
  const percent = Math.round(Math.max(0, Math.min(1, props.progress)) * 100);
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <SystemLoader className="h-4 w-4 shrink-0" />
            Remotion đang render MP4
          </div>
          <span className="font-mono text-sm font-semibold">{percent}%</span>
        </div>
        <Progress value={percent} className="h-2" />
        <p className="text-xs text-muted-foreground">{props.message || "Đang chuẩn bị render..."}</p>
      </CardContent>
    </Card>
  );
}
