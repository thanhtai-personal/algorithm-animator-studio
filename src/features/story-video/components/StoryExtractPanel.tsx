import { Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import type { useStoryVideoStudio } from "../useStoryVideoStudio";

type StoryStudio = ReturnType<typeof useStoryVideoStudio>;

export function StoryExtractPanel({ studio }: { studio: StoryStudio }) {
  return (
    <Card className="space-y-4 border-border/70 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.30)]">
      <div>
        <h2 className="flex items-center gap-2 font-semibold"><Link2 className="h-4 w-4 text-cyan-400" /> Lấy text từ web</h2>
        <p className="text-xs text-muted-foreground">Clone luồng WebTextExtractor từ template: lấy link chương rồi trích xuất nội dung theo selector.</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <Label>URL trang danh sách chương</Label>
          <Input className="mt-2" value={studio.linkPageUrl} onChange={(e) => studio.setLinkPageUrl(e.target.value)} placeholder="https://example.com/muc-luc" />
        </div>
        <div>
          <Label>Selector link chương</Label>
          <Input className="mt-2" value={studio.linkSelector} onChange={(e) => studio.setLinkSelector(e.target.value)} placeholder="a[href], .chapter-list a" />
        </div>
      </div>

      <Button variant="outline" onClick={studio.discoverLinks} disabled={!studio.linkPageUrl.trim() || studio.loading.links}>
        {studio.loading.links ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
        Lấy danh sách link chương
      </Button>

      {studio.linkResult?.links.length ? (
        <ScrollArea className="h-36 rounded-lg border border-border bg-muted/20 p-3 text-xs">
          {studio.linkResult.links.map((link, index) => <div key={`${link.href}-${index}`} className="mb-2 truncate"><b>{index + 1}.</b> {link.text} — {link.href}</div>)}
        </ScrollArea>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-[1.35fr_0.65fr]">
        <div>
          <Label>Danh sách URL chương ({studio.urlCount})</Label>
          <Textarea className="mt-2 min-h-40 font-mono text-xs" value={studio.urlList} onChange={(e) => studio.setUrlList(e.target.value)} placeholder="Mỗi dòng một URL chương" />
        </div>
        <div>
          <Label>Selector nội dung</Label>
          <Input className="mt-2" value={studio.contentSelector} onChange={(e) => studio.setContentSelector(e.target.value)} />
          <Button className="mt-3 w-full" onClick={studio.extractText} disabled={!studio.urlCount || studio.loading.extract}>
            {studio.loading.extract ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Lấy text vào kịch bản
          </Button>
          {studio.extractResult ? <p className="mt-2 text-xs text-muted-foreground">Thành công: {studio.extractResult.results.filter((item) => item.ok).length}/{studio.extractResult.results.length} URL · {studio.extractResult.characterCount.toLocaleString("vi-VN")} ký tự.</p> : null}
        </div>
      </div>
    </Card>
  );
}
