import { Bot, Copy, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { useStoryReviewStudio } from "../useStoryReviewStudio";

type Studio = ReturnType<typeof useStoryReviewStudio>;

export function ReviewScriptPanel({ studio }: { studio: Studio }) {
  return (
    <Card className="space-y-4 border-border/70 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.30)]">
      <div>
        <h2 className="flex items-center gap-2 font-semibold">
          <Bot className="h-4 w-4 text-cyan-400" /> Step 2 - Dán lời thoại review
        </h2>
        <p className="text-xs text-muted-foreground">Copy prompt sang AI khác, lấy lời thoại đã viết và dán lại vào đây.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => studio.copyToClipboard(studio.scriptPrompt, "Đã copy prompt viết lời thoại.")}>
          <Copy className="mr-2 h-4 w-4" /> Copy prompt Step 1
        </Button>
        <Button onClick={studio.generateScenePrompts} disabled={!studio.draft.reviewScript.trim() && !studio.draft.sourceNotes.trim()}>
          <Wand2 className="mr-2 h-4 w-4" /> Tạo prompt phân cảnh Veo3
        </Button>
      </div>

      <div>
        <Label>Lời thoại review đã tạo</Label>
        <Textarea
          className="mt-2 min-h-[440px] text-base leading-7"
          value={studio.draft.reviewScript}
          onChange={(event) => studio.updateDraft({ reviewScript: event.target.value })}
          placeholder="Dán lời thoại review từ AI vào đây..."
        />
      </div>
    </Card>
  );
}
