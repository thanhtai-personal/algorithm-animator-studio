import { ArrowRight, Plus, RefreshCcw, ShieldCheck, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { useMuNewsStudio } from "../useMuNewsStudio";

export function MuNewsSourcesPanel({ studio }: { studio: ReturnType<typeof useMuNewsStudio> }) {
  const sourceRows = sourcesTextToRows(studio.sourcesText);

  function updateSourceRow(index: number, patch: Partial<SourceRow>) {
    const rows = [...sourceRows];
    rows[index] = { ...rows[index], ...patch };
    studio.setSourcesText(rowsToSourcesText(rows));
  }

  function addSourceRow() {
    studio.setSourcesText(rowsToSourcesText([...sourceRows, { name: "", url: "", trustScore: "6", contentSelector: "" }]));
  }

  function removeSourceRow(index: number) {
    const rows = sourceRows.filter((_, rowIndex) => rowIndex !== index);
    studio.setSourcesText(rowsToSourcesText(rows));
  }

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

          <div className="grid min-w-0 gap-3">
            <div className="flex items-center justify-between gap-3">
              <Label>Danh sách nguồn tin</Label>
              <Button type="button" size="sm" variant="outline" onClick={addSourceRow}>
                <Plus className="mr-2 h-4 w-4" /> Thêm nguồn
              </Button>
            </div>
            <div className="grid min-w-0 gap-2 rounded-xl border border-border bg-background/60 p-3">
              <div className="hidden grid-cols-[minmax(120px,0.7fr)_minmax(220px,1.2fr)_minmax(130px,0.7fr)_80px_40px] gap-2 px-1 text-xs font-medium text-muted-foreground md:grid">
                <span>Tên nguồn</span>
                <span>RSS URL</span>
                <span>Content selector</span>
                <span>Trust</span>
                <span />
              </div>
              {sourceRows.map((source, index) => (
                <div key={index} className="grid min-w-0 gap-2 rounded-lg border border-border bg-muted/10 p-2 md:grid-cols-[minmax(120px,0.7fr)_minmax(220px,1.2fr)_minmax(130px,0.7fr)_80px_40px] md:border-0 md:bg-transparent md:p-0">
                  <div className="grid min-w-0 gap-1 md:block">
                    <Label className="text-xs text-muted-foreground md:hidden">Tên nguồn</Label>
                    <Input
                      value={source.name}
                      onChange={(event) => updateSourceRow(index, { name: event.target.value })}
                      placeholder="BBC Sport"
                    />
                  </div>
                  <div className="grid min-w-0 gap-1 md:block">
                    <Label className="text-xs text-muted-foreground md:hidden">RSS URL</Label>
                    <Input
                      value={source.url}
                      onChange={(event) => updateSourceRow(index, { url: event.target.value })}
                      placeholder="https://example.com/rss.xml"
                    />
                  </div>
                  <div className="grid min-w-0 gap-1 md:block">
                    <Label className="text-xs text-muted-foreground md:hidden">Content selector</Label>
                    <Input
                      value={source.contentSelector}
                      onChange={(event) => updateSourceRow(index, { contentSelector: event.target.value })}
                      placeholder="article, main, .content"
                    />
                  </div>
                  <div className="grid min-w-0 gap-1 md:block">
                    <Label className="text-xs text-muted-foreground md:hidden">Trust</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={source.trustScore}
                      onChange={(event) => updateSourceRow(index, { trustScore: event.target.value })}
                    />
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-10 w-full md:w-10"
                    onClick={() => removeSourceRow(index)}
                    aria-label="Xóa nguồn tin"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              Content selector có thể để trống. Chỉ nhập khi RSS không có mô tả sạch và cần lấy nội dung từ trang bài viết.
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

type SourceRow = {
  name: string;
  url: string;
  trustScore: string;
  contentSelector: string;
};

function sourcesTextToRows(text: string): SourceRow[] {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name = "", url = "", trustScore = "6", contentSelector = ""] = line.split("|").map((part) => part.trim());
      return { name, url, trustScore, contentSelector };
    });

  return rows.length ? rows : [{ name: "", url: "", trustScore: "6", contentSelector: "" }];
}

function rowsToSourcesText(rows: SourceRow[]) {
  return rows
    .map((row) => ({
      name: row.name.trim(),
      url: row.url.trim(),
      trustScore: String(Number(row.trustScore) || 6),
      contentSelector: row.contentSelector.trim(),
    }))
    .filter((row) => row.name || row.url)
    .map((row) => [row.name, row.url, row.trustScore, row.contentSelector].filter((part, index) => index < 3 || part).join(" | "))
    .join("\n");
}
