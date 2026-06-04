import { ExternalLink, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Lang } from "@/lib/i18n";
import { getYoutubeChannelVideos, type YoutubeChannelVideo, type YoutubeUploadHistoryItem } from "@/lib/youtubeApi";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Props = {
  history: YoutubeUploadHistoryItem[];
  refreshHistory: () => Promise<void>;
  refreshToken?: string;
  title?: string;
  subtitle?: string;
  uploadsPlaylistId?: string;
  lang: Lang;
};

export function YoutubeUploadHistoryCard({ history, lang, refreshHistory, refreshToken, subtitle, title, uploadsPlaylistId }: Props) {
  const vi = lang === "vi";
  const [videos, setVideos] = useState<YoutubeChannelVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);

  useEffect(() => {
    void refreshVideos();
  }, [refreshToken, uploadsPlaylistId]);

  async function refreshAll() {
    await Promise.all([refreshHistory(), refreshVideos()]);
  }

  async function refreshVideos() {
    if (!refreshToken) {
      setVideos([]);
      return;
    }
    setLoadingVideos(true);
    try {
      setVideos(await getYoutubeChannelVideos(refreshToken, uploadsPlaylistId));
    } catch (error) {
      setVideos([]);
      toast.error(error instanceof Error ? error.message : txt(vi, "Không tải được video của kênh.", "Could not load channel videos."));
    } finally {
      setLoadingVideos(false);
    }
  }

  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">{title || txt(vi, "Lịch sử upload", "Upload history")}</h2>
          <p className="text-xs text-muted-foreground">{subtitle || txt(vi, "Theo dõi video đăng từ file upload hoặc video đã tạo trong app.", "Track videos published from uploaded files or videos generated in the app.")}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => void refreshAll()}>
          <RefreshCcw className="mr-2 h-4 w-4" />{txt(vi, "Tải lại", "Refresh")}
        </Button>
      </div>
      <section className="space-y-2">
        <h3 className="text-sm font-semibold">{txt(vi, "Video trên kênh", "Channel videos")}</h3>
        {loadingVideos ? <p className="text-sm text-muted-foreground">{txt(vi, "Đang tải video...", "Loading videos...")}</p> : null}
        {!loadingVideos && !videos.length ? <p className="text-sm text-muted-foreground">{txt(vi, "Chưa tải được video nào từ kênh.", "No channel videos loaded.")}</p> : null}
        {videos.length ? (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {videos.map((video) => (
              <a key={video.id} className="rounded-lg border border-border p-3 hover:bg-muted/40" href={video.url} target="_blank" rel="noreferrer">
                {video.thumbnailUrl ? <img src={video.thumbnailUrl} alt="" className="mb-2 aspect-video w-full rounded-md object-cover" /> : null}
                <p className="line-clamp-2 text-sm font-medium">{video.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{video.publishedAt ? new Date(video.publishedAt).toLocaleString() : video.id}</p>
              </a>
            ))}
          </div>
        ) : null}
      </section>
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
