import { FileText, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { useStoryAuthorStudio } from "../useStoryAuthorStudio";

type Studio = ReturnType<typeof useStoryAuthorStudio>;

export function StoryChapterEditor({ studio }: { studio: Studio }) {
  const project = studio.selectedProject;
  const chapter = studio.selectedChapter;

  if (!project) return null;

  return (
    <Card className="space-y-4 border-border/70 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.30)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-semibold"><FileText className="h-4 w-4 text-cyan-400" /> Nội dung chương</h2>
          <p className="text-xs text-muted-foreground">Viết và lưu lại từng chương trong cùng một truyện.</p>
        </div>
        <Button variant="outline" onClick={studio.addChapter}>
          <Plus className="mr-2 h-4 w-4" /> Thêm chương
        </Button>
      </div>

      <div className="grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div>
          <Label>Danh sách chương</Label>
          <Select value={studio.selectedChapterId} onValueChange={studio.setSelectedChapterId}>
            <SelectTrigger className="mt-2"><SelectValue placeholder="Chọn chương" /></SelectTrigger>
            <SelectContent>
              {project.chapters.map((item, index) => (
                <SelectItem key={item.id} value={item.id}>{index + 1}. {item.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="mt-3 space-y-2">
            {project.chapters.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => studio.setSelectedChapterId(item.id)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${item.id === chapter?.id ? "border-cyan-500/60 bg-cyan-500/10" : "border-border bg-muted/20 hover:bg-muted/40"}`}
              >
                <div className="truncate font-medium">{index + 1}. {item.title}</div>
                <div className="text-xs text-muted-foreground">{item.content.length.toLocaleString("vi-VN")} ký tự</div>
              </button>
            ))}
          </div>
        </div>

        {chapter ? (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div>
                <Label>Tên chương</Label>
                <Input className="mt-2" value={chapter.title} onChange={(event) => studio.updateChapter({ title: event.target.value })} />
              </div>
              <Button className="self-end" variant="destructive" onClick={() => studio.deleteChapter(chapter.id)} disabled={project.chapters.length <= 1}>
                <Trash2 className="mr-2 h-4 w-4" /> Xóa chương
              </Button>
            </div>
            <div>
              <Label>Nội dung</Label>
              <Textarea
                className="mt-2 min-h-[520px] font-serif text-base leading-7"
                value={chapter.content}
                onChange={(event) => studio.updateChapter({ content: event.target.value })}
                placeholder="Viết nội dung chương tại đây..."
              />
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
