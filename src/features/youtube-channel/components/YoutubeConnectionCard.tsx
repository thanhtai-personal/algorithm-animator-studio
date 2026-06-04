import { RefreshCcw, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { useYoutubeChannelManager } from "../useYoutubeChannelManager";

type Manager = ReturnType<typeof useYoutubeChannelManager>;

type Props = Pick<Manager, "channel" | "config" | "connectYoutube" | "disconnect" | "loading" | "refreshChannelData" | "refreshToken">;

export function YoutubeConnectionCard({ channel, config, connectYoutube, disconnect, loading, refreshChannelData, refreshToken }: Props) {
  const ready = Boolean(config?.hasClientId && config?.hasClientSecret);
  return (
    <Card className="h-fit space-y-4 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 text-red-300">
          <Youtube className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-semibold">Kết nối YouTube</h2>
          <p className="text-xs text-muted-foreground">OAuth chạy qua server .env, không nhập secret trên giao diện.</p>
        </div>
      </div>
      <div className={`rounded-lg border px-3 py-2 text-sm ${ready ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-yellow-400/30 bg-yellow-400/10 text-yellow-200"}`}>
        {ready ? "OAuth env đã sẵn sàng. Có thể cấp quyền kênh và upload video." : "Thiếu YOUTUBE_CLIENT_ID hoặc YOUTUBE_CLIENT_SECRET trong .env server."}
      </div>
      {refreshToken ? <p className="text-xs text-emerald-300">Đã có quyền YouTube trong trình duyệt này.</p> : null}
      {channel ? <p className="text-xs text-muted-foreground">Kênh đang kết nối: <span className="text-foreground">{channel.title}</span></p> : null}
      <div className="grid gap-2">
        <Button onClick={connectYoutube} disabled={loading || !ready}>{refreshToken ? "Đăng nhập lại YouTube" : "Login YouTube"}</Button>
        <Button variant="outline" onClick={() => refreshChannelData()} disabled={!refreshToken}>
          <RefreshCcw className="mr-2 h-4 w-4" />Tải lại dữ liệu kênh
        </Button>
        <Button variant="ghost" onClick={disconnect} disabled={!refreshToken}>Ngắt kết nối</Button>
      </div>
      <p className="text-xs text-muted-foreground">Refresh token chỉ lưu localStorage để tool local upload nhanh. Client secret vẫn nằm server-side.</p>
    </Card>
  );
}
