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
    <Card className="border-border/70 shadow-[0_16px_40px_rgba(15,23,42,0.22)]">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-red-400" /> Nguồn tin MU
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Mỗi dòng: Tên nguồn | RSS URL | điểm tin cậy 1-10.</p>
          </div>
          <Button onClick={studio.loadNews} disabled={!studio.canFetchNews}>
            <RefreshCcw className="mr-2 h-4 w-4" /> {studio.loading.news ? "Đang tải..." : "Load tin hôm nay"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label>Từ khóa lọc tin</Label>
          <Input value={studio.query} onChange={(event) => studio.setQuery(event.target.value)} placeholder="Manchester United OR Man Utd OR MUFC" />
        </div>
        <div className="grid gap-2">
          <Label>Danh sách RSS / Google News RSS</Label>
          <Textarea className="min-h-32 font-mono text-xs" value={studio.sourcesText} onChange={(event) => studio.setSourcesText(event.target.value)} />
          <p className="text-xs text-muted-foreground">Có thể thêm RSS của BBC, Sky, The Athletic, trang chủ MU hoặc Google News search RSS. Tool sẽ lọc theo từ khóa phía trên.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{studio.sources.length} nguồn hợp lệ</Badge>
          <Badge variant="outline">{studio.newsResult?.count || 0} tin đã tải</Badge>
          <Badge variant="outline">{studio.selectedItems.length} tin được chọn</Badge>
          <Button size="sm" variant="outline" onClick={() => studio.selectTopNews(6)} disabled={!studio.newsResult?.items.length}>Chọn top 6</Button>
        </div>

        {studio.newsResult?.items.length ? (
          <div className="space-y-3">
            {studio.newsResult.items.map((item) => {
              const checked = studio.selectedIds.includes(item.id);
              return (
                <article key={item.id} className="rounded-xl border border-border bg-muted/20 p-3">
                  <div className="flex items-start gap-3">
                    <Checkbox checked={checked} onCheckedChange={(value) => studio.toggleItem(item, value === true)} className="mt-1" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {checked ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : null}
                        <Badge className="bg-red-600 text-white hover:bg-red-600">{item.trustScore}/10</Badge>
                        <Badge variant="outline">{item.sourceName}</Badge>
                        <span className="text-xs text-muted-foreground">{formatDateTime(item.publishedAt)}</span>
                      </div>
                      <h3 className="text-sm font-semibold leading-6">{item.title}</h3>
                      {item.summary ? <p className="line-clamp-3 text-xs leading-5 text-muted-foreground">{item.summary}</p> : null}
                      <a className="block truncate text-xs text-cyan-300 underline-offset-4 hover:underline" href={item.link} target="_blank" rel="noreferrer">{item.link}</a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Bấm “Load tin hôm nay” để lấy tin MU từ các nguồn đã cấu hình.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
