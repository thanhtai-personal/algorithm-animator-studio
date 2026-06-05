import { Plus, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STORY_STATUS_LABELS, type StoryStatus } from "../types";
import type { useStoryAuthorStudio } from "../useStoryAuthorStudio";
import { uiText } from "@/lib/i18n";

type Studio = ReturnType<typeof useStoryAuthorStudio>;

export function StoryLibraryPanel({ studio }: { studio: Studio }) {
  return (
    <Card className="space-y-4 border-border/70 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.30)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">{uiText("Kho truyện sáng tác")}</h2>
          <p className="text-xs text-muted-foreground">{studio.filteredProjects.length}/{studio.projects.length} truyện đang hiển thị</p>
        </div>
        <Button size="sm" onClick={studio.createProject}>
          <Plus className="mr-2 h-4 w-4" /> Truyện mới
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <Label>{uiText("Tìm kiếm")}</Label>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              value={studio.filters.query}
              onChange={(event) => studio.setFilters({ ...studio.filters, query: event.target.value })}
              placeholder={uiText("Tên truyện, ý tưởng, tag...", "Story title, idea, tag...")}
            />
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
          <FilterSelect label={uiText("Trạng thái")} value={studio.filters.status} onChange={(status) => studio.setFilters({ ...studio.filters, status: status as "all" | StoryStatus })} items={Object.entries(STORY_STATUS_LABELS)} />
          <FilterSelect label={uiText("Thể loại")} value={studio.filters.genre} onChange={(genre) => studio.setFilters({ ...studio.filters, genre })} items={studio.genres.map((genre) => [genre, genre])} />
          <FilterSelect label={uiText("Tag")} value={studio.filters.tag} onChange={(tag) => studio.setFilters({ ...studio.filters, tag })} items={studio.tags.map((tag) => [tag, tag])} />
        </div>
      </div>

      <div className="space-y-2">
        {studio.filteredProjects.map((project) => (
          <button
            key={project.id}
            type="button"
            onClick={() => studio.selectProject(project.id)}
            className={`w-full rounded-lg border p-3 text-left transition ${project.id === studio.selectedProjectId ? "border-emerald-500/60 bg-emerald-500/10" : "border-border bg-muted/20 hover:bg-muted/40"}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-medium">{project.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{project.genre || "Chưa có thể loại"} · {project.chapters.length} chương</div>
              </div>
              <Badge variant="outline">{STORY_STATUS_LABELS[project.status]}</Badge>
            </div>
            {project.tags.length ? <div className="mt-2 truncate text-xs text-muted-foreground">#{project.tags.join(" #")}</div> : null}
          </button>
        ))}
      </div>

      {studio.selectedProject ? (
        <Button className="w-full" variant="destructive" onClick={() => studio.deleteProject(studio.selectedProject!.id)}>
          <Trash2 className="mr-2 h-4 w-4" /> Xóa truyện đang chọn
        </Button>
      ) : null}
    </Card>
  );
}

function FilterSelect(props: { label: string; value: string; items: [string, string][]; onChange: (value: string) => void }) {
  return (
    <div>
      <Label>{props.label}</Label>
      <Select value={props.value} onValueChange={props.onChange}>
        <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{uiText("Tất cả")}</SelectItem>
          {props.items.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
