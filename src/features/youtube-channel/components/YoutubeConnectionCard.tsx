import { RefreshCcw, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Lang } from "@/lib/i18n";
import type { useYoutubeChannelManager } from "../useYoutubeChannelManager";

type Manager = ReturnType<typeof useYoutubeChannelManager>;

type Props = Pick<Manager, "channel" | "config" | "connectYoutube" | "disconnect" | "loading" | "oauthRedirectUri" | "refreshChannelData" | "refreshToken"> & {
  lang: Lang;
};

export function YoutubeConnectionCard({ channel, config, connectYoutube, disconnect, lang, loading, oauthRedirectUri, refreshChannelData, refreshToken }: Props) {
  const ready = Boolean(config?.hasClientId && config?.hasClientSecret);
  const vi = lang === "vi";
  return (
    <Card className="h-fit space-y-4 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 text-red-300">
          <Youtube className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-semibold">{txt(vi, "Kết nối YouTube", "YouTube Connection")}</h2>
          <p className="text-xs text-muted-foreground">{txt(vi, "Cấp quyền kênh để lấy playlist, xem thông tin kênh và đăng video.", "Authorize a channel to load playlists, view channel data, and publish videos.")}</p>
        </div>
      </div>
      <div className={`rounded-lg border px-3 py-2 text-sm ${ready ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-yellow-400/30 bg-yellow-400/10 text-yellow-200"}`}>
        {ready ? txt(vi, "Kết nối đã sẵn sàng. Bạn có thể cấp quyền cho kênh đang chọn.", "Connection is ready. You can authorize the selected channel.") : txt(vi, "Chưa thể kết nối YouTube. Vui lòng kiểm tra cấu hình kết nối ở máy chạy app.", "YouTube cannot connect yet. Check the connection config on the machine running the app.")}
      </div>
      {config ? (
        <div className="space-y-1 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <p>{txt(vi, "Redirect URI cần khai báo trong Google Console:", "Redirect URI to register in Google Console:")} <span className="break-all text-foreground">{oauthRedirectUri}</span></p>
          {config.clientIdHint ? <p>{txt(vi, "OAuth client id server đang dùng:", "OAuth client id used by server:")} <span className="text-foreground">{config.clientIdHint}</span></p> : null}
        </div>
      ) : null}
      {refreshToken ? <p className="text-xs text-emerald-300">{txt(vi, "Kênh đang chọn đã được cấp quyền.", "Selected channel is authorized.")}</p> : null}
      {channel ? <p className="text-xs text-muted-foreground">{txt(vi, "Kênh đang kết nối:", "Connected channel:")} <span className="text-foreground">{channel.title}</span></p> : null}
      <div className="grid gap-2">
        <Button onClick={connectYoutube} disabled={loading || !ready}>{refreshToken ? txt(vi, "Cấp quyền lại", "Authorize again") : txt(vi, "Kết nối YouTube", "Connect YouTube")}</Button>
        <Button variant="outline" onClick={() => refreshChannelData()} disabled={!refreshToken}>
          <RefreshCcw className="mr-2 h-4 w-4" />{txt(vi, "Tải lại dữ liệu kênh", "Refresh channel data")}
        </Button>
        <Button variant="ghost" onClick={disconnect} disabled={!refreshToken}>{txt(vi, "Ngắt kết nối", "Disconnect")}</Button>
      </div>
      <p className="text-xs text-muted-foreground">{txt(vi, "Mỗi kênh nên được cấp quyền riêng để quản lý upload và lịch sử chính xác.", "Each channel should be authorized separately so uploads and history stay accurate.")}</p>
    </Card>
  );
}

function txt(vi: boolean, viText: string, enText: string) {
  return vi ? viText : enText;
}
