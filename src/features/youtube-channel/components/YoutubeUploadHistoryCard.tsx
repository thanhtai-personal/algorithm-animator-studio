import { ExternalLink, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { YoutubeUploadHistoryItem } from "@/lib/youtubeApi";

type Props = {
  history: YoutubeUploadHistoryItem[];
  refreshHistory: () => Promise<void>;
};

export function YoutubeUploadHistoryCard({ history, refreshHistory }: Props) {
  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Lịch sử upload</h2>
          <p className="text-xs text-muted-foreground">Theo dõi video đăng từ file upload hoặc video đã tạo trong app.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => void refreshHistory()}>
          <RefreshCcw className="mr-2 h-4 w-4" />Tải lại
        </Button>
      </div>
      {history.length ? (
        <div className="space-y-2">
          {history.slice(0, 12).map((item) => (
            <div key={item.id} className="rounded-lg border border-border p-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{item.title || item.sourceFileName || "Untitled upload"}</p>
                  <p className="text-xs text-muted-foreground">{new Date(item.attemptedAtMs).toLocaleString()} · {item.source}</p>
                </div>
                <Badge variant={item.status === "success" ? "default" : "destructive"}>{item.status}</Badge>
              </div>
              {item.youtubeUrl ? <a className="mt-2 inline-flex items-center gap-2 text-sm text-red-400 underline" href={item.youtubeUrl} target="_blank" rel="noreferrer">Mở video <ExternalLink className="h-3.5 w-3.5" /></a> : null}
              {item.message ? <p className="mt-2 text-xs text-yellow-300">{item.message}</p> : null}
            </div>
          ))}
        </div>
      ) : <p className="text-sm text-muted-foreground">Chưa có lịch sử upload.</p>}
    </Card>
  );
}
