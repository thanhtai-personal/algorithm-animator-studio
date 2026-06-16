import { Upload, Video } from "lucide-react";
import { SystemLoader } from "@/components/ui/system-loader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { VideoAspectRatio, VideoFitMode } from "@/features/story-video/types";
import type { useStoryReviewStudio } from "../useStoryReviewStudio";
import { uiText } from "@/lib/i18n";

type Studio = ReturnType<typeof useStoryReviewStudio>;

export function ReviewRenderPanel({ studio }: { studio: Studio }) {
  const { draft } = studio;

  return (
    <Card className="space-y-4 border-border/70 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.30)]">
      <div>
        <h2 className="flex items-center gap-2 font-semibold">
          <Video className="h-4 w-4 text-emerald-400" /> Step 4 - Ghép video review
        </h2>
        <p className="text-xs text-muted-foreground">{uiText("Ghép các clip nhỏ hoặc ảnh có thời lượng thành video review. Audio lời thoại là tùy chọn.")}</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-4">
        <div>
          <Label>{uiText("Tên file video")}</Label>
          <Input className="mt-2" value={draft.videoFileName} onChange={(event) => studio.updateDraft({ videoFileName: event.target.value })} />
        </div>
        <div>
          <Label>{uiText("Tỉ lệ")}</Label>
          <Select value={draft.aspectRatio} onValueChange={(aspectRatio) => studio.updateDraft({ aspectRatio: aspectRatio as VideoAspectRatio })}>
            <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="16:9">16:9</SelectItem>
              <SelectItem value="9:16">9:16</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{uiText("Fit mode")}</Label>
          <Select value={draft.fitMode} onValueChange={(fitMode) => studio.updateDraft({ fitMode: fitMode as VideoFitMode })}>
            <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cover">{uiText("cover")}</SelectItem>
              <SelectItem value="contain">{uiText("contain")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{uiText("Audio lời thoại")}</Label>
          <Input className="mt-2" type="file" accept="audio/*" onChange={(event) => studio.setAudioFile(event.target.files?.[0] || null)} />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
        Đã có file cho {studio.scenesWithFiles}/{studio.scenes.length} phân cảnh. Ảnh sẽ hiển thị theo số giây đã nhập; video sẽ được loop/trim theo thời lượng cảnh.
      </div>

      <Button onClick={studio.mergeVideo} disabled={!studio.canMerge}>
        {studio.loading ? <SystemLoader className="mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
        Ghép video review
      </Button>

      {studio.videoResult?.video.videoUrl ? (
        <div className="space-y-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-3">
          <p className="text-sm font-semibold text-emerald-200">Video đã tạo: {studio.videoResult.video.fileName}</p>
          <video src={studio.videoResult.video.videoUrl} controls className="w-full rounded-lg" />
        </div>
      ) : null}
    </Card>
  );
}
