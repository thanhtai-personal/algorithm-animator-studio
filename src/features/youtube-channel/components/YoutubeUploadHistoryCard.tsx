import { ExternalLink, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Lang } from "@/lib/i18n";
import type { YoutubeUploadHistoryItem } from "@/lib/youtubeApi";

type Props = {
  history: YoutubeUploadHistoryItem[];
  refreshHistory: () => Promise<void>;
  title?: string;
  subtitle?: string;
  lang: Lang;
};

export function YoutubeUploadHistoryCard({ history, lang, refreshHistory, subtitle, title }: Props) {
  const vi = lang === "vi";
  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">{title || txt(vi, "Lịch sử upload", "Upload history")}</h2>
          <p className="text-xs text-muted-foreground">{subtitle || txt(vi, "Theo dõi video đăng từ file upload hoặc video đã tạo trong app.", "Track videos published from uploaded files or videos generated in the app.")}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => void refreshHistory()}>
          <RefreshCcw className="mr-2 h-4 w-4" />{txt(vi, "Tải lại", "Refresh")}
        </Button>
      </div>
      {history.length ? (
        <div className="space-y-2">
          {history.slice(0, 20).map((item) => (
            <div key={item.id} className="rounded-lg border border-border p-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{item.title || item.sourceFileName || txt(vi, "Upload chưa đặt tên", "Untitled upload")}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.attemptedAtMs).toLocaleString()} · {item.source}
                    {item.channelTitle ? ` · ${item.channelTitle}` : ""}
                  </p>
                </div>
                <Badge variant={item.status === "success" ? "default" : "destructive"}>{item.status === "success" ? txt(vi, "Thành công", "Success") : txt(vi, "Thất bại", "Failure")}</Badge>
              </div>
              {item.youtubeUrl ? <a className="mt-2 inline-flex items-center gap-2 text-sm text-red-400 underline" href={item.youtubeUrl} target="_blank" rel="noreferrer">{txt(vi, "Mở video", "Open video")} <ExternalLink className="h-3.5 w-3.5" /></a> : null}
              {item.message ? <p className="mt-2 text-xs text-yellow-300">{item.message}</p> : null}
            </div>
          ))}
        </div>
      ) : <p className="text-sm text-muted-foreground">{txt(vi, "Chưa có lịch sử upload.", "No upload history yet.")}</p>}
    </Card>
  );
}

function txt(vi: boolean, viText: string, enText: string) {
  return vi ? viText : enText;
}
