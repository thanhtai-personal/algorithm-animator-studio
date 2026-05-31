import { Copy, Plus, Trash2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { useStoryReviewStudio } from "../useStoryReviewStudio";

type Studio = ReturnType<typeof useStoryReviewStudio>;

export function ReviewScenesPanel({ studio }: { studio: Studio }) {
  return (
    <Card className="space-y-4 border-border/70 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.30)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            <Video className="h-4 w-4 text-purple-400" /> Step 3 - Prompt phân cảnh Veo3
          </h2>
          <p className="text-xs text-muted-foreground">Tạo/copy từng prompt sang Google Veo3, rồi upload clip hoặc ảnh về từng cảnh.</p>
        </div>
        <Button variant="outline" onClick={studio.addScene}>
          <Plus className="mr-2 h-4 w-4" /> Thêm cảnh
        </Button>
      </div>

      <div className="space-y-3">
        {studio.scenes.map((scene, index) => (
          <div key={scene.id} className="grid gap-3 rounded-lg border border-border bg-muted/20 p-3 lg:grid-cols-[160px_minmax(0,1fr)_160px]">
            <div className="space-y-3">
              <div>
                <Label>Tên cảnh</Label>
                <Input className="mt-2" value={scene.title} onChange={(event) => studio.updateScene(scene.id, { title: event.target.value })} />
              </div>
              <div>
                <Label>Thời lượng giây</Label>
                <Input
                  className="mt-2"
                  type="number"
                  min={1}
                  max={120}
                  value={scene.durationSeconds}
                  onChange={(event) => studio.updateScene(scene.id, { durationSeconds: Number(event.target.value) || 1 })}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <Label>Prompt Veo3 #{index + 1}</Label>
                <Button size="sm" variant="outline" onClick={() => studio.copyToClipboard(scene.prompt, `Đã copy prompt ${scene.title}.`)}>
                  <Copy className="mr-2 h-4 w-4" /> Copy
                </Button>
              </div>
              <Textarea className="min-h-40 font-mono text-xs" value={scene.prompt} onChange={(event) => studio.updateScene(scene.id, { prompt: event.target.value })} />
            </div>

            <div className="space-y-3">
              <div>
                <Label>Clip/ảnh đã tạo</Label>
                <Input className="mt-2" type="file" accept="image/*,video/*" onChange={(event) => studio.updateScene(scene.id, { file: event.target.files?.[0] || null })} />
                <p className="mt-1 truncate text-xs text-muted-foreground">{scene.file?.name || "Chưa chọn file"}</p>
              </div>
              <Button className="w-full" variant="destructive" onClick={() => studio.removeScene(scene.id)}>
                <Trash2 className="mr-2 h-4 w-4" /> Xóa
              </Button>
            </div>
          </div>
        ))}
      </div>

      {!studio.scenes.length ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Chưa có phân cảnh. Sang Step 2 để tạo prompt từ lời thoại hoặc bấm thêm cảnh thủ công.
        </div>
      ) : null}
    </Card>
  );
}
