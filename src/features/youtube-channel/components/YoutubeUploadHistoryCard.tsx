import { ExternalLink, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Lang } from "@/lib/i18n";
import { getYoutubeChannelVideos, type YoutubeChannelVideo, type YoutubeUploadHistoryItem } from "@/lib/youtubeApi";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Props = {
  history: YoutubeUploadHistoryItem[];
  refreshHistory: () => Promise<void>;
  refreshToken?: string;
  title?: string;
  subtitle?: string;
  uploadsPlaylistId?: string;
  lang: Lang;
  pageSize?: number;
  showUploadHistory?: boolean;
};

export function YoutubeUploadHistoryCard({ history, lang, pageSize = 6, refreshHistory, refreshToken, showUploadHistory = true, subtitle, title, uploadsPlaylistId }: Props) {
  const vi = lang === "vi";
  const [videos, setVideos] = useState<YoutubeChannelVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(videos.length / pageSize));
  const pageVideos = useMemo(() => videos.slice((page - 1) * pageSize, page * pageSize), [page, pageSize, videos]);

  useEffect(() => {
    void refreshVideos();
  }, [refreshToken, uploadsPlaylistId]);
  useEffect(() => {
    setPage(1);
  }, [refreshToken, uploadsPlaylistId, videos.length]);

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
          {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
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
            {pageVideos.map((video) => (
              <a key={video.id} className="rounded-lg border border-border p-3 hover:bg-muted/40" href={video.url} target="_blank" rel="noreferrer">
                {video.thumbnailUrl ? <img src={video.thumbnailUrl} alt="" className="mb-2 aspect-video w-full rounded-md object-cover" /> : null}
                <p className="line-clamp-2 text-sm font-medium">{video.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{video.publishedAt ? new Date(video.publishedAt).toLocaleString() : video.id}</p>
              </a>
            ))}
          </div>
        ) : null}
        {videos.length > pageSize ? (
          <div className="flex flex-col gap-2 pt-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>{txt(vi, "Trang", "Page")} {page}/{pageCount} · {txt(vi, "Tổng video", "Total videos")}: {videos.length}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>{txt(vi, "Trước", "Prev")}</Button>
              <Button size="sm" variant="outline" disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>{txt(vi, "Sau", "Next")}</Button>
            </div>
          </div>
        ) : null}
      </section>
      {showUploadHistory && history.length ? (
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
      ) : null}
      {showUploadHistory && !history.length ? <p className="text-sm text-muted-foreground">{txt(vi, "Chưa có lịch sử upload.", "No upload history yet.")}</p> : null}
    </Card>
  );
}

function txt(vi: boolean, viText: string, enText: string) {
  return vi ? viText : enText;
}
