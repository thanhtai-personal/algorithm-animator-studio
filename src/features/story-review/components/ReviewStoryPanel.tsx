import { Copy, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { useStoryReviewStudio } from "../useStoryReviewStudio";

type Studio = ReturnType<typeof useStoryReviewStudio>;

export function ReviewStoryPanel({ studio }: { studio: Studio }) {
  const { draft } = studio;

  return (
    <Card className="space-y-4 border-border/70 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.30)]">
      <div>
        <h2 className="flex items-center gap-2 font-semibold">
          <FileText className="h-4 w-4 text-emerald-400" /> Step 1 - Chọn truyện và nguồn
        </h2>
        <p className="text-xs text-muted-foreground">Nhập thông tin truyện để tạo prompt viết lời thoại review.</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Field label="Tên truyện" value={draft.storyTitle} onChange={(storyTitle) => studio.updateDraft({ storyTitle })} />
        <Field label="Nguồn truyện" value={draft.sourceName} onChange={(sourceName) => studio.updateDraft({ sourceName })} />
        <Field label="URL nguồn" value={draft.sourceUrl} onChange={(sourceUrl) => studio.updateDraft({ sourceUrl })} />
        <Field label="Thể loại" value={draft.genre} onChange={(genre) => studio.updateDraft({ genre })} />
        <Field label="Khán giả mục tiêu" value={draft.targetAudience} onChange={(targetAudience) => studio.updateDraft({ targetAudience })} />
        <Field label="Góc review" value={draft.angle} onChange={(angle) => studio.updateDraft({ angle })} />
      </div>

      <div>
        <Label>Ghi chú nguồn / tóm tắt truyện</Label>
        <Textarea
          className="mt-2 min-h-40"
          value={draft.sourceNotes}
          onChange={(event) => studio.updateDraft({ sourceNotes: event.target.value })}
          placeholder="Dán tóm tắt, tuyến nhân vật, link chương quan trọng, nhận xét cá nhân..."
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <Label>Prompt viết lời thoại review</Label>
          <Button size="sm" variant="outline" onClick={() => studio.copyToClipboard(studio.scriptPrompt, "Đã copy prompt viết lời thoại.")}>
            <Copy className="mr-2 h-4 w-4" /> Copy prompt
          </Button>
        </div>
        <Textarea readOnly className="min-h-72 font-mono text-xs" value={studio.scriptPrompt} />
      </div>
    </Card>
  );
}

function Field(props: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <Label>{props.label}</Label>
      <Input className="mt-2" value={props.value} onChange={(event) => props.onChange(event.target.value)} />
    </div>
  );
}
