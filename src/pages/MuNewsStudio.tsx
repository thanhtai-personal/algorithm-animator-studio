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
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <main className="mx-auto grid w-full max-w-[1780px] grid-cols-1 gap-3 px-3 py-3 sm:gap-4 sm:px-4 lg:p-5 xl:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="min-w-0 space-y-3 sm:space-y-4 xl:sticky xl:top-4 xl:self-start">
          <Card className="overflow-hidden border-red-500/20 bg-gradient-to-br from-red-950/50 via-background to-background shadow-[0_16px_40px_rgba(15,23,42,0.28)]">
            <CardHeader className="space-y-3 p-4 sm:p-6">
              <CardTitle className="flex items-start gap-2 text-lg leading-7 sm:text-xl">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                <span>Kênh tin tức MU</span>
              </CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">
                Workflow bán tự động cho fan MU: load RSS, AI tổng hợp kịch bản, Piper đọc, render video nháp rồi bạn duyệt.
              </p>
            </CardHeader>
            <CardContent className="grid gap-2 p-4 pt-0 text-sm sm:p-6 sm:pt-0">
              <StatusLine label="Nguồn RSS" value={`${studio.sources.length} nguồn`} />
              <StatusLine label="Tin đã tải" value={`${studio.newsResult?.count || 0} tin`} />
              <StatusLine label="Tin chọn vào video" value={`${studio.selectedItems.length} tin`} />
              <StatusLine label="Kịch bản" value={studio.script ? `${studio.script.length.toLocaleString("vi-VN")} ký tự` : "chưa có"} />
              <StatusLine label="Audio" value={studio.audioResult?.fileName || "chưa tạo"} />
              <StatusLine label="Video" value={studio.videoResult?.video.fileName || "chưa render"} />
              <Button className="mt-1 w-full" variant="outline" onClick={studio.resetDraft}>
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
            <Alert className="whitespace-pre-line border-red-500/40 bg-red-500/10">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Thông báo</AlertTitle>
              <AlertDescription className="break-words">{studio.message}</AlertDescription>
            </Alert>
          ) : null}
        </aside>

        <section className="min-w-0 space-y-3 sm:space-y-4">
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
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2 sm:flex sm:justify-between">
      <span className="min-w-0 text-muted-foreground">{props.label}</span>
      <span className="min-w-0 max-w-[150px] truncate text-right font-medium sm:max-w-[180px]">{props.value}</span>
    </div>
  );
}
