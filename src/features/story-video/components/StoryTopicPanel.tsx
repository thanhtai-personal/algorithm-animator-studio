import { BookOpen, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { StoryTopicId } from "../types";
import type { useStoryVideoStudio } from "../useStoryVideoStudio";

type StoryStudio = ReturnType<typeof useStoryVideoStudio>;

export function StoryTopicPanel({ studio }: { studio: StoryStudio }) {
  return (
    <Card className="space-y-4 border-border/70 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.30)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            <BookOpen className="h-4 w-4 text-emerald-400" /> Chủ đề sản xuất
          </h2>
          <p className="text-xs text-muted-foreground">Chọn preset để chuyển workflow sang kênh đọc truyện.</p>
        </div>
        <Badge variant="outline" className="border-emerald-400/50 text-emerald-300">Story channel</Badge>
      </div>

      <div>
        <Label>Chủ đề / dòng nội dung</Label>
        <Select value={studio.topicId} onValueChange={(value) => studio.changeTopic(value as StoryTopicId)}>
          <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
          <SelectContent>
            {studio.topics.map((topic) => <SelectItem key={topic.id} value={topic.id}>{topic.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
          <Sparkles className="h-4 w-4" /> {studio.topic.title}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{studio.topic.description}</p>
        <p className="mt-2 text-xs text-emerald-100/80">{studio.topic.prompt}</p>
      </div>
    </Card>
  );
}
