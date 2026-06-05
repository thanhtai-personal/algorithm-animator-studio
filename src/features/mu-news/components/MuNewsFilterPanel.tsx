import { ArrowRight, CheckCircle2, Filter, Loader2, ShieldAlert, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { MuNewsItem, MuNewsItemValidation } from "../types";
import type { useMuNewsStudio } from "../useMuNewsStudio";
import { uiText } from "@/lib/i18n";

type MuNewsStudio = ReturnType<typeof useMuNewsStudio>;

export function MuNewsFilterPanel({ studio }: { studio: MuNewsStudio }) {
  const items = getFilterItems(studio);

  return (
    <Card className="min-w-0 overflow-hidden border-border/70 shadow-[0_16px_40px_rgba(15,23,42,0.22)]">
      <CardHeader className="space-y-3 p-4 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-start gap-2 text-base leading-7 sm:text-lg">
              <Filter className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
              <span>{uiText("Step 3 — Lọc tin chi tiết")}</span>
            </CardTitle>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Tải từng URL đã chọn theo thứ tự, trích nội dung bài và kiểm tra thời gian publish. Tin không lấy được content hoặc sai ngày sẽ chuyển đỏ và tự bỏ chọn.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button className="w-full sm:w-auto" variant="outline" onClick={studio.filterSelectedNews} disabled={!studio.selectedItems.length || studio.filteringNews}>
              {studio.filteringNews ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
              {studio.filteringNews ? "Đang lọc..." : "Kiểm tra tin đã chọn"}
            </Button>
            <Button className="w-full sm:w-auto" onClick={studio.createScript} disabled={!studio.canGenerateScript}>
              Tạo prompt <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid min-w-0 gap-4 p-4 pt-0 sm:p-6 sm:pt-0">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Badge variant={studio.selectedItems.length ? "default" : "outline"}>{studio.selectedItems.length.toLocaleString("vi-VN")} tin đang chọn</Badge>
          <Badge variant={studio.selectedNewsValidated ? "default" : "outline"}>{studio.selectedNewsValidated ? "Đã kiểm tra xong" : "Chưa đủ điều kiện viết"}</Badge>
          {studio.invalidNewsCount ? <Badge variant="destructive">{studio.invalidNewsCount.toLocaleString("vi-VN")} tin bị loại</Badge> : null}
        </div>

        <ScrollArea className="h-[58vh] min-h-[420px] rounded-xl border border-border bg-muted/10">
          <div className="grid min-w-0 gap-3 p-3 sm:p-4">
            {items.length ? items.map((item) => (
              <FilterItemRow
                key={item.id}
                item={item}
                selected={studio.selectedIds.includes(item.id)}
                validation={studio.newsValidationById[item.id]}
                onSelectedChange={(checked) => studio.toggleItem(item, checked)}
              />
            )) : (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Chưa chọn tin nào. Quay lại Step 2 để chọn tin cần lọc.
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function getFilterItems(studio: MuNewsStudio) {
  return (studio.newsResult?.items || []).filter((item) => (
    studio.selectedIds.includes(item.id) || Boolean(studio.newsValidationById[item.id])
  ));
}

function FilterItemRow(props: {
  item: MuNewsItem;
  selected: boolean;
  validation?: MuNewsItemValidation;
  onSelectedChange: (checked: boolean) => void;
}) {
  const state = props.validation?.status || "idle";
  const invalid = state === "invalid" || state === "error";
  const loading = state === "loading";
  const dateLabel = props.item.publishedAt ? new Date(props.item.publishedAt).toLocaleString("vi-VN") : "không rõ ngày";
  const detailDateLabel = props.validation?.detailPublishedAt ? new Date(props.validation.detailPublishedAt).toLocaleString("vi-VN") : "";

  return (
    <article className={`grid min-w-0 gap-3 rounded-xl border p-3 transition sm:grid-cols-[auto_minmax(0,1fr)] sm:p-4 ${invalid ? "border-red-500/70 bg-red-500/10" : props.selected ? "border-emerald-500/50 bg-emerald-500/10" : "border-border bg-background/70"}`}>
      <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted/50 sm:flex-col sm:items-center sm:justify-center">
        <Checkbox className="h-5 w-5" checked={props.selected} onCheckedChange={(checked) => props.onSelectedChange(checked === true)} disabled={loading} />
        <span className="sm:hidden">{props.selected ? "Đã chọn" : "Bỏ chọn"}</span>
        <span className="hidden text-xs text-muted-foreground sm:inline">{props.selected ? "Chọn" : "Bỏ"}</span>
      </label>
      <div className="min-w-0 space-y-2">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <h3 className="min-w-0 break-words text-sm font-semibold leading-6 sm:text-base">{props.item.title}</h3>
          <ValidationBadge validation={props.validation} selected={props.selected} />
        </div>
        <p className="break-words text-sm leading-6 text-muted-foreground">{props.validation?.message || "Chưa kiểm tra chi tiết bài viết."}</p>
        {props.validation?.articleContent ? (
          <p className="line-clamp-3 break-words rounded-lg border border-border bg-background/60 p-2 text-xs leading-5 text-muted-foreground">
            {props.validation.articleContent}
          </p>
        ) : null}
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="truncate">{props.item.sourceName}</span>
          <span>RSS: {dateLabel}</span>
          {detailDateLabel ? <span>Bài viết: {detailDateLabel}</span> : null}
          {props.validation?.detailPublishedSource ? <span>Nguồn ngày: {props.validation.detailPublishedSource}</span> : null}
          {props.validation?.articleContent ? <span>{props.validation.articleContent.length.toLocaleString("vi-VN")} ký tự content</span> : null}
        </div>
      </div>
    </article>
  );
}

function ValidationBadge({ validation, selected }: { validation?: MuNewsItemValidation; selected: boolean }) {
  if (validation?.status === "loading") {
    return <Badge className="w-fit shrink-0" variant="secondary"><Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> {uiText("Đang kiểm tra")}</Badge>;
  }
  if (validation?.status === "valid") {
    return <Badge className="w-fit shrink-0"><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> {uiText("Hợp lệ")}</Badge>;
  }
  if (validation?.status === "invalid" || validation?.status === "error") {
    return <Badge className="w-fit shrink-0" variant="destructive"><XCircle className="mr-1 h-3.5 w-3.5" /> {uiText("Đã bỏ chọn")}</Badge>;
  }
  return <Badge className="w-fit shrink-0" variant="outline">{selected ? "Chưa kiểm tra" : "Chưa chọn"}</Badge>;
}
