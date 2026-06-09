import { BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { STORY_STATUS_LABELS, type StoryStatus } from "../types";
import type { useStoryAuthorStudio } from "../useStoryAuthorStudio";
import { uiText } from "@/lib/i18n";

type Studio = ReturnType<typeof useStoryAuthorStudio>;

export function StoryDetailsPanel({ studio }: { studio: Studio }) {
  const project = studio.selectedProject;
  if (!project) {
    return <Card className="p-6 text-sm text-muted-foreground">{uiText("Chưa có truyện. Bấm “Truyện mới” để bắt đầu lưu ý tưởng.")}</Card>;
  }

  return (
    <Card className="space-y-4 border-border/70 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.30)]">
      <div>
        <h2 className="flex items-center gap-2 font-semibold"><BookOpen className="h-4 w-4 text-emerald-400" /> {uiText("Thông tin truyện")}</h2>
        <p className="text-xs text-muted-foreground">{uiText("Lưu premise, nhân vật, thế giới, link tài liệu và outline để tìm lại khi cần.")}</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.2fr_0.7fr_0.7fr]">
        <Field label={uiText("Tên truyện")} value={project.title} onChange={(title) => studio.updateProject({ title })} />
        <Field label={uiText("Thể loại")} value={project.genre} onChange={(genre) => studio.updateProject({ genre })} />
        <div>
          <Label>{uiText("Trạng thái")}</Label>
          <Select value={project.status} onValueChange={(status) => studio.updateProject({ status: status as StoryStatus })}>
            <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(STORY_STATUS_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Field label={uiText("Tags")} value={project.tags.join(", ")} onChange={(tags) => studio.updateProject({ tags: splitTags(tags) })} placeholder={uiText("tu luyện, báo thù, nữ cường")} />

      <TextAreaField label={uiText("Ý tưởng chính / premise")} value={project.premise} onChange={(premise) => studio.updateProject({ premise })} />
      <TextAreaField
        label={uiText("Link tài liệu / nguồn tham khảo")}
        value={project.documentLinks}
        onChange={(documentLinks) => studio.updateProject({ documentLinks })}
        placeholder={uiText("Dán link Google Docs, Drive, Notion, Sheet, video, bài nghiên cứu... Mỗi link một dòng.")}
        className="min-h-24"
      />
      <div className="grid gap-3 lg:grid-cols-2">
        <TextAreaField label={uiText("Nhân vật")} value={project.characters} onChange={(characters) => studio.updateProject({ characters })} />
        <TextAreaField label={uiText("Thế giới / bối cảnh")} value={project.worldNotes} onChange={(worldNotes) => studio.updateProject({ worldNotes })} />
      </div>
      <TextAreaField label={uiText("Outline")} value={project.outline} onChange={(outline) => studio.updateProject({ outline })} className="min-h-44" />
    </Card>
  );
}

function Field(props: { label: string; value: string; placeholder?: string; onChange: (value: string) => void }) {
  return (
    <div>
      <Label>{props.label}</Label>
      <Input className="mt-2" value={props.value} placeholder={props.placeholder} onChange={(event) => props.onChange(event.target.value)} />
    </div>
  );
}

function TextAreaField(props: {
  label: string;
  value: string;
  placeholder?: string;
  className?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label>{props.label}</Label>
      <Textarea
        className={`mt-2 min-h-32 ${props.className || ""}`}
        value={props.value}
        placeholder={props.placeholder}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </div>
  );
}

function splitTags(value: string) {
  return Array.from(new Set(value.split(",").map((tag) => tag.trim()).filter(Boolean)));
}
