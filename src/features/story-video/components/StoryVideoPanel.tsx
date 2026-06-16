import { Film, Upload } from "lucide-react";
import { SystemLoader } from "@/components/ui/system-loader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { VideoAspectRatio, VideoBackgroundType, VideoFitMode } from "../types";
import type { useStoryVideoStudio } from "../useStoryVideoStudio";
import { uiText } from "@/lib/i18n";

type StoryStudio = ReturnType<typeof useStoryVideoStudio>;

export function StoryVideoPanel({ studio }: { studio: StoryStudio }) {
  return (
    <Card className="space-y-4 border-border/70 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.30)]">
      <div>
        <h2 className="flex items-center gap-2 font-semibold"><Film className="h-4 w-4 text-purple-400" /> {uiText("Tạo video từ audio + nền")}</h2>
        <p className="text-xs text-muted-foreground">{uiText("Clone video workflow từ template: chọn audio, nền ảnh/GIF/video, xuất MP4 bằng FFmpeg.")}</p>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1fr_1fr_1fr]">
        <div>
          <Label>{uiText("Audio đã tạo")}</Label>
          <Select value={studio.selectedAudioPath} onValueChange={studio.setSelectedAudioPath}>
            <SelectTrigger className="mt-2"><SelectValue placeholder={uiText("Chọn audio")} /></SelectTrigger>
            <SelectContent>
              {studio.generatedAudio.slice(0, 80).map((audio) => <SelectItem key={audio.relativePath} value={audio.relativePath}>{audio.fileName}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <FileField label={uiText("Hoặc upload audio")} accept="audio/*" onChange={studio.setUploadedAudioFile} />
        <div>
          <Label>{uiText("Tên file video")}</Label>
          <Input className="mt-2" value={studio.videoFileName} onChange={(e) => studio.setVideoFileName(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1fr_0.75fr_0.75fr_0.75fr]">
        <FileField label={uiText("Nền video")} accept="image/*,video/*" onChange={studio.setBackgroundFile} />
        <SelectField label={uiText("Loại nền")} value={studio.backgroundType} onValueChange={(v) => studio.setBackgroundType(v as VideoBackgroundType)} items={["image", "gif", "video"]} />
        <SelectField label={uiText("Tỉ lệ")} value={studio.aspectRatio} onValueChange={(v) => studio.setAspectRatio(v as VideoAspectRatio)} items={["16:9", "9:16"]} />
        <SelectField label={uiText("Fit mode")} value={studio.fitMode} onValueChange={(v) => studio.setFitMode(v as VideoFitMode)} items={["cover", "contain"]} />
      </div>

      {studio.backgroundPreviewUrl ? (
        <div className="overflow-hidden rounded-xl border border-border bg-slate-950">
          {studio.backgroundType === "video" ? (
            <video src={studio.backgroundPreviewUrl} controls className="max-h-72 w-full object-contain" />
          ) : (
            <img src={studio.backgroundPreviewUrl} alt={uiText("Preview nền")} className="max-h-72 w-full object-contain" />
          )}
        </div>
      ) : null}

      <Button onClick={studio.generateVideo} disabled={!studio.canGenerateVideo}>
        {studio.loading.video ? <SystemLoader className="mr-2 h-4 w-4" /> : <Film className="mr-2 h-4 w-4" />}
        Tạo video MP4
      </Button>

      {studio.videoResult?.video.videoUrl ? (
        <div className="space-y-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-3">
          <p className="text-sm font-semibold text-emerald-200">Video đã tạo: {studio.videoResult.video.fileName}</p>
          <video src={studio.videoResult.video.videoUrl} controls className="w-full rounded-lg" />
        </div>
      ) : null}

      {studio.generatedVideos.length ? (
        <ScrollArea className="h-40 rounded-lg border border-border bg-muted/20 p-3 text-xs">
          {studio.generatedVideos.slice(0, 40).map((video) => <div key={`${video.relativePath}-${video.createdAtMs}`} className="mb-2 truncate">{video.fileName} — {video.relativePath}</div>)}
        </ScrollArea>
      ) : null}
    </Card>
  );
}

function FileField(props: { label: string; accept: string; onChange: (file: File | null) => void }) {
  return (
    <div>
      <Label>{props.label}</Label>
      <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-muted/40">
        <Upload className="h-4 w-4" />
        <span className="truncate">{uiText("Chọn tệp")}</span>
        <input type="file" accept={props.accept} className="hidden" onChange={(e) => props.onChange(e.target.files?.[0] || null)} />
      </label>
    </div>
  );
}

function SelectField(props: { label: string; value: string; items: string[]; onValueChange: (value: string) => void }) {
  return (
    <div>
      <Label>{props.label}</Label>
      <Select value={props.value} onValueChange={props.onValueChange}>
        <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
        <SelectContent>{props.items.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}
