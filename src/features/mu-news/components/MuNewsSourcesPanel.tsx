import { CheckCircle2, RefreshCcw, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "../muNewsUtils";
import type { useMuNewsStudio } from "../useMuNewsStudio";

export function MuNewsSourcesPanel({ studio }: { studio: ReturnType<typeof useMuNewsStudio> }) {
  return (
    <Card className="min-w-0 overflow-hidden border-border/70 shadow-[0_16px_40px_rgba(15,23,42,0.22)]">
      <CardHeader className="space-y-3 p-4 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-start gap-2 text-base leading-7 sm:text-lg">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
              <span>Nguồn tin MU</span>
            </CardTitle>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Mỗi dòng: Tên nguồn | RSS URL | điểm tin cậy 1-10.</p>
          </div>
          <Button className="w-full shrink-0 sm:w-auto" onClick={studio.loadNews} disabled={!studio.canFetchNews}>
            <RefreshCcw className="mr-2 h-4 w-4" /> {studio.loading.news ? "Đang tải..." : "Load tin hôm nay"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid min-w-0 gap-4 p-4 pt-0 sm:p-6 sm:pt-0">
        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(220px,0.8fr)_minmax(320px,1.2fr)]">
          <div className="grid min-w-0 gap-2">
            <Label>Từ khóa lọc tin</Label>
            <Input
              className="min-w-0"
              value={studio.query}
              onChange={(event) => studio.setQuery(event.target.value)}
              placeholder="Manchester United OR Man Utd OR MUFC"
            />
          </div>
          <div className="grid min-w-0 gap-2">
            <Label>Danh sách RSS / Google News RSS</Label>
            <Textarea
              className="min-h-32 min-w-0 resize-y font-mono text-xs leading-5"
              value={studio.sourcesText}
              onChange={(event) => studio.setSourcesText(event.target.value)}
            />
            <p className="text-xs leading-5 text-muted-foreground">
              Có thể thêm RSS của BBC, Sky, The Athletic, trang chủ MU hoặc Google News search RSS. Tool sẽ lọc theo từ khóa phía trên.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Badge variant="secondary">{studio.sources.length} nguồn hợp lệ</Badge>
            <Badge variant="outline">{studio.newsResult?.count || 0} tin đã tải</Badge>
            <Badge variant="outline">{studio.selectedItems.length} tin được chọn</Badge>
          </div>
          <Button className="w-full sm:ml-auto sm:w-auto" size="sm" variant="outline" onClick={() => studio.selectTopNews(6)} disabled={!studio.newsResult?.items.length}>
            Chọn top 6
          </Button>
        </div>

        {studio.newsResult?.items.length ? (
          <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
            {studio.newsResult.items.map((item) => {
              const checked = studio.selectedIds.includes(item.id);
              return (
                <article key={item.id} className="min-w-0 rounded-xl border border-border bg-muted/20 p-3 transition-colors hover:bg-muted/30">
                  <div className="flex min-w-0 items-start gap-3">
                    <Checkbox checked={checked} onCheckedChange={(value) => studio.toggleItem(item, value === true)} className="mt-1 shrink-0" />
                    <div className="min-w-0 flex-1 space-y-2 overflow-hidden">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        {checked ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : null}
                        <Badge className="shrink-0 bg-red-600 text-white hover:bg-red-600">{item.trustScore}/10</Badge>
                        <Badge className="max-w-full truncate" variant="outline">{item.sourceName}</Badge>
                        <span className="text-xs text-muted-foreground">{formatDateTime(item.publishedAt)}</span>
                      </div>
                      <h3 className="break-words text-sm font-semibold leading-6">{item.title}</h3>
                      {item.summary ? <p className="line-clamp-3 break-words text-xs leading-5 text-muted-foreground">{item.summary}</p> : null}
                      <a className="block break-all text-xs text-cyan-300 underline-offset-4 hover:underline" href={item.link} target="_blank" rel="noreferrer">
                        {item.link}
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-5 text-center text-sm leading-6 text-muted-foreground sm:p-6">
            Bấm “Load tin hôm nay” để lấy tin MU từ các nguồn đã cấu hình.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
