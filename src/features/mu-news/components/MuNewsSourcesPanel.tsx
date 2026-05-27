import { ArrowRight, RefreshCcw, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { useMuNewsStudio } from "../useMuNewsStudio";

export function MuNewsSourcesPanel({ studio }: { studio: ReturnType<typeof useMuNewsStudio> }) {
  return (
    <Card className="min-w-0 overflow-hidden border-border/70 shadow-[0_16px_40px_rgba(15,23,42,0.22)]">
      <CardHeader className="space-y-3 p-4 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-start gap-2 text-base leading-7 sm:text-lg">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
              <span>Step 1 — Xác định nguồn tin tức</span>
            </CardTitle>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Cấu hình RSS/Google News RSS và từ khóa lọc trước khi lấy tin. Mỗi dòng: Tên nguồn | RSS URL | điểm tin cậy 1-10.
            </p>
          </div>
          <Button className="w-full shrink-0 sm:w-auto" onClick={studio.loadNews} disabled={!studio.canFetchNews}>
            <RefreshCcw className="mr-2 h-4 w-4" /> {studio.loading.news ? "Đang tải..." : "Load tin hôm nay"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid min-w-0 gap-4 p-4 pt-0 sm:p-6 sm:pt-0">
        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(280px,0.7fr)_minmax(360px,1.3fr)]">
          <div className="grid min-w-0 gap-4 rounded-xl border border-border bg-muted/20 p-3 sm:p-4">
            <div className="grid min-w-0 gap-2">
              <Label>Từ khóa lọc tin</Label>
              <Input
                className="min-w-0"
                value={studio.query}
                onChange={(event) => studio.setQuery(event.target.value)}
                placeholder="Manchester United OR Man Utd OR MUFC"
              />
              <p className="text-xs leading-5 text-muted-foreground">Dùng OR để gom nhiều từ khóa. Nên giữ MUFC/Man Utd để tránh lọt tin không liên quan.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{studio.sources.length} nguồn hợp lệ</Badge>
              <Badge variant="outline">Step tiếp theo: preview tin</Badge>
            </div>
          </div>

          <div className="grid min-w-0 gap-2">
            <Label>Danh sách nguồn tin</Label>
            <Textarea
              className="min-h-[340px] min-w-0 resize-y font-mono text-xs leading-5 lg:min-h-[440px]"
              value={studio.sourcesText}
              onChange={(event) => studio.setSourcesText(event.target.value)}
            />
            <p className="text-xs leading-5 text-muted-foreground">
              Có thể thêm RSS của BBC, Sky, The Athletic, trang chủ MU hoặc Google News search RSS. Điểm tin cậy dùng để AI xếp độ ưu tiên khi viết kịch bản.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border p-3 text-sm leading-6 text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <span>Bấm load tin để chuyển sang Step 2. Tin tải xong sẽ được chọn top 6 mặc định, bạn có thể bật/tắt lại từng tin.</span>
          <Button className="w-full sm:w-auto" variant="outline" onClick={() => studio.setActiveStep("preview")} disabled={!studio.newsResult?.items.length}>
            Sang preview <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
