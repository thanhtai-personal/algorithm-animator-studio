import { ArrowRight, CheckSquare, ExternalLink, FileText, Newspaper, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { MuNewsItem } from "../types";
import type { useMuNewsStudio } from "../useMuNewsStudio";

type MuNewsStudio = ReturnType<typeof useMuNewsStudio>;

export function MuNewsPreviewPanel({ studio }: { studio: MuNewsStudio }) {
  const items = studio.newsResult?.items || [];

  return (
    <Card className="min-w-0 overflow-hidden border-border/70 shadow-[0_16px_40px_rgba(15,23,42,0.22)]">
      <CardHeader className="space-y-3 p-4 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-start gap-2 text-base leading-7 sm:text-lg">
              <Newspaper className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
              <span>Step 2 — Preview và chọn tin</span>
            </CardTitle>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Duyệt headline đã tải, chọn các tin đủ tin cậy để AI viết bản tin theo góc nhìn fan Việt.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button className="w-full sm:w-auto" variant="outline" onClick={studio.loadNews} disabled={!studio.canFetchNews}>
              <RefreshCcw className="mr-2 h-4 w-4" /> {studio.loading.news ? "Đang tải..." : "Load lại"}
            </Button>
            <Button className="w-full sm:w-auto" onClick={studio.createScript} disabled={!studio.canGenerateScript}>
              <FileText className="mr-2 h-4 w-4" /> {studio.loading.script ? "Đang viết..." : "Viết kịch bản"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid min-w-0 gap-4 p-4 pt-0 sm:p-6 sm:pt-0">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Badge variant="secondary">{items.length.toLocaleString("vi-VN")} tin tải được</Badge>
          <Badge variant="outline">{studio.selectedItems.length.toLocaleString("vi-VN")} tin đang chọn</Badge>
          <Button className="w-full sm:ml-auto sm:w-auto" size="sm" variant="outline" onClick={() => studio.selectTopNews(6)} disabled={!items.length}>
            <CheckSquare className="mr-2 h-4 w-4" /> Chọn top 6
          </Button>
        </div>

        {studio.newsResult?.warnings?.length ? (
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm leading-6 text-yellow-100">
            {studio.newsResult.warnings.join(" ")}
          </div>
        ) : null}

        <ScrollArea className="h-[58vh] min-h-[420px] rounded-xl border border-border bg-muted/10">
          <div className="grid min-w-0 gap-3 p-3 sm:p-4">
            {items.length ? items.map((item) => (
              <NewsItemRow
                key={item.id}
                item={item}
                selected={studio.selectedIds.includes(item.id)}
                onSelectedChange={(checked) => studio.toggleItem(item, checked)}
              />
            )) : (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Chưa có tin. Quay lại Step 1 và bấm load tin hôm nay.
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button className="w-full sm:w-auto" onClick={studio.createScript} disabled={!studio.canGenerateScript}>
            Tạo kịch bản từ tin đã chọn <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function NewsItemRow(props: { item: MuNewsItem; selected: boolean; onSelectedChange: (checked: boolean) => void }) {
  const dateLabel = props.item.publishedAt ? new Date(props.item.publishedAt).toLocaleString("vi-VN") : "không rõ ngày";

  return (
    <article className="grid min-w-0 gap-3 rounded-xl border border-border bg-background/70 p-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:p-4">
      <Checkbox className="mt-1" checked={props.selected} onCheckedChange={(checked) => props.onSelectedChange(checked === true)} />
      <div className="min-w-0 space-y-2">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <h3 className="min-w-0 break-words text-sm font-semibold leading-6 sm:text-base">{props.item.title}</h3>
          <Badge className="w-fit shrink-0" variant={props.item.trustScore >= 7 ? "default" : "secondary"}>
            Trust {props.item.trustScore}/10
          </Badge>
        </div>
        <p className="break-words text-sm leading-6 text-muted-foreground">{props.item.summary || "Không có mô tả ngắn."}</p>
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="truncate">{props.item.sourceName}</span>
          <span>•</span>
          <span>{dateLabel}</span>
          <a className="inline-flex min-w-0 items-center gap-1 text-red-300 hover:text-red-200" href={props.item.link} target="_blank" rel="noreferrer">
            <span className="truncate">Mở nguồn</span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          </a>
        </div>
      </div>
    </article>
  );
}
