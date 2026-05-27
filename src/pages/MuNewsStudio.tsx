import { AlertCircle, RefreshCcw, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MuNewsScriptPanel } from "@/features/mu-news/components/MuNewsScriptPanel";
import { MuNewsSourcesPanel } from "@/features/mu-news/components/MuNewsSourcesPanel";
import { MuNewsVoiceVideoPanel } from "@/features/mu-news/components/MuNewsVoiceVideoPanel";
import { useMuNewsStudio } from "@/features/mu-news/useMuNewsStudio";

export default function MuNewsStudio() {
  const studio = useMuNewsStudio();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="grid grid-cols-1 gap-4 p-4 2xl:grid-cols-[380px_1fr]">
        <aside className="space-y-4">
          <Card className="border-red-500/20 bg-gradient-to-br from-red-950/50 via-background to-background shadow-[0_16px_40px_rgba(15,23,42,0.28)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ShieldAlert className="h-5 w-5 text-red-400" /> Kênh tin tức MU
              </CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">
                Workflow bán tự động cho fan MU: load RSS, AI tổng hợp kịch bản, Piper đọc, render video nháp rồi bạn duyệt.
              </p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <StatusLine label="Nguồn RSS" value={`${studio.sources.length} nguồn`} />
              <StatusLine label="Tin đã tải" value={`${studio.newsResult?.count || 0} tin`} />
              <StatusLine label="Tin chọn vào video" value={`${studio.selectedItems.length} tin`} />
              <StatusLine label="Kịch bản" value={studio.script ? `${studio.script.length.toLocaleString("vi-VN")} ký tự` : "chưa có"} />
              <StatusLine label="Audio" value={studio.audioResult?.fileName || "chưa tạo"} />
              <StatusLine label="Video" value={studio.videoResult?.video.fileName || "chưa render"} />
              <Button className="w-full" variant="outline" onClick={studio.resetDraft}>
                <RefreshCcw className="mr-2 h-4 w-4" /> Làm bản tin mới
              </Button>
            </CardContent>
          </Card>

          <Alert className="border-yellow-500/40 bg-yellow-500/10">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Lưu ý kiếm tiền</AlertTitle>
            <AlertDescription className="text-sm leading-6">
              Không dịch nguyên văn bài báo. Nên giữ nguồn, chấm độ tin cậy và thêm góc nhìn fan Việt để tránh thành nội dung đọc báo hàng loạt.
            </AlertDescription>
          </Alert>

          {studio.message ? (
            <Alert className="border-red-500/40 bg-red-500/10 whitespace-pre-line">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Thông báo</AlertTitle>
              <AlertDescription>{studio.message}</AlertDescription>
            </Alert>
          ) : null}
        </aside>

        <section className="space-y-4">
          <MuNewsSourcesPanel studio={studio} />
          <MuNewsScriptPanel studio={studio} />
          <MuNewsVoiceVideoPanel studio={studio} />
        </section>
      </main>
    </div>
  );
}

function StatusLine(props: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2">
      <span className="text-muted-foreground">{props.label}</span>
      <span className="max-w-[180px] truncate font-medium">{props.value}</span>
    </div>
  );
}
