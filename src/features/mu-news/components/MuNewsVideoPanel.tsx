import { Film, Loader2, Music2, Upload, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { VideoAspectRatio, VideoBackgroundType, VideoFitMode } from "@/features/story-video/types";
import type { useMuNewsStudio } from "../useMuNewsStudio";
import { uiText } from "@/lib/i18n";

type MuNewsStudio = ReturnType<typeof useMuNewsStudio>;

export function MuNewsVideoPanel({ studio }: { studio: MuNewsStudio }) {
  return (
    <Card className="min-w-0 overflow-hidden border-border/70 shadow-[0_16px_40px_rgba(15,23,42,0.22)]">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-start gap-2 text-base leading-7 sm:text-lg">
              <Film className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
              <span>{uiText("Step 5 — Render video timeline")}</span>
            </CardTitle>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Ghép voice đã chọn với nhiều ảnh nền, nhạc nền và xuất video theo tỉ lệ mong muốn.
            </p>
          </div>
          <Button className="w-full sm:w-auto" onClick={studio.createVideo} disabled={!studio.canGenerateVideo}>
            {studio.loading.video ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Film className="mr-2 h-4 w-4" />}
            Render video
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid min-w-0 gap-4 p-4 pt-0 sm:p-6 sm:pt-0">
        <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_150px_150px_150px]">
          <div className="grid min-w-0 gap-2">
            <Label>{uiText("Tên file video")}</Label>
            <Input value={studio.videoFileName} onChange={(event) => studio.setVideoFileName(event.target.value)} />
          </div>
          <SelectField label={uiText("Loại nền")} value={studio.backgroundType} items={["image", "gif", "video"]} onValueChange={(value) => studio.setBackgroundType(value as VideoBackgroundType)} />
          <SelectField label={uiText("Tỉ lệ")} value={studio.aspectRatio} items={["16:9", "9:16"]} onValueChange={(value) => studio.setAspectRatio(value as VideoAspectRatio)} />
          <SelectField label={uiText("Fit mode")} value={studio.fitMode} items={["cover", "contain"]} onValueChange={(value) => studio.setFitMode(value as VideoFitMode)} />
        </div>

        <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Badge variant="secondary">{studio.selectedVoiceFileCount} file voice</Badge>
            <Badge variant="outline">{studio.backgrounds.length} ảnh nền</Badge>
            <Badge variant={studio.canGenerateVideo ? "default" : "secondary"}>{studio.canGenerateVideo ? "Sẵn sàng render" : "Thiếu voice hoặc nền"}</Badge>
          </div>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-muted/40">
            <Upload className="h-4 w-4" />
            <span className="truncate">{uiText("Thêm ảnh nền")}</span>
            <input type="file" multiple accept="image/*" className="hidden" onChange={(event) => studio.addBackgroundFiles(event.target.files || [])} />
          </label>
        </div>

        <ScrollArea className="h-80 rounded-xl border border-border bg-muted/10">
          <div className="grid min-w-0 gap-3 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-3">
            {studio.backgrounds.length ? studio.backgrounds.map((background) => (
              <div key={background.id} className="grid min-w-0 gap-3 rounded-xl border border-border bg-background/70 p-3">
                <img src={background.previewUrl} alt={uiText("Nền video")} className="aspect-video w-full rounded-lg bg-slate-950 object-cover" />
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
                  <div className="grid min-w-0 gap-2">
                    <Label>{uiText("Thời lượng giây")}</Label>
                    <Input type="number" min={1} max={120} value={background.durationSeconds} onChange={(event) => studio.updateBackground(background.id, Number(event.target.value))} />
                  </div>
                  <Button variant="outline" size="icon" onClick={() => studio.removeBackground(background.id)} aria-label={uiText("Xóa ảnh nền")}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )) : (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">
                Chưa có ảnh nền. Upload nhiều ảnh để tạo timeline thay đổi cảnh.
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="grid min-w-0 gap-3 rounded-xl border border-border bg-muted/20 p-3 sm:p-4 lg:grid-cols-[minmax(0,1fr)_150px_150px_150px]">
          <div className="grid min-w-0 gap-2">
            <Label className="flex items-center gap-2"><Music2 className="h-4 w-4" /> {uiText("Nhạc nền")}</Label>
            <Select value={studio.backgroundMusicRelativePath || "none"} onValueChange={(value) => studio.setBackgroundMusicRelativePath(value === "none" ? "" : value)}>
              <SelectTrigger><SelectValue placeholder={uiText("Chọn nhạc nền")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{uiText("Không dùng nhạc nền")}</SelectItem>
                {studio.musicTracks.map((track) => <SelectItem key={track.relativePath} value={track.relativePath}>{track.fileName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <SliderField label={uiText("Âm lượng")} value={studio.backgroundMusicVolume} min={0} max={1} step={0.01} onChange={studio.setBackgroundMusicVolume} />
          <SliderField label={uiText("Fade in")} value={studio.backgroundMusicFadeIn} min={0} max={8} step={0.25} onChange={studio.setBackgroundMusicFadeIn} />
          <SliderField label={uiText("Fade out")} value={studio.backgroundMusicFadeOut} min={0} max={8} step={0.25} onChange={studio.setBackgroundMusicFadeOut} />
          <div className="flex items-center justify-between rounded-lg border border-border bg-background/70 px-3 py-2 lg:col-span-4">
            <Label>{uiText("Loop nhạc nền")}</Label>
            <Switch checked={studio.backgroundMusicLoop} onCheckedChange={studio.setBackgroundMusicLoop} />
          </div>
        </div>

        {studio.videoResult?.video.videoUrl ? (
          <div className="grid min-w-0 gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 sm:p-4">
            <p className="break-words text-sm font-semibold text-emerald-100">Video đã tạo: {studio.videoResult.video.fileName}</p>
            <video src={studio.videoResult.video.videoUrl} controls className="w-full rounded-lg bg-slate-950" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SelectField(props: { label: string; value: string; items: string[]; onValueChange: (value: string) => void }) {
  return (
    <div className="grid min-w-0 gap-2">
      <Label>{props.label}</Label>
      <Select value={props.value} onValueChange={props.onValueChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{props.items.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}

function SliderField(props: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) {
  return (
    <div className="grid min-w-0 gap-2">
      <Label>{props.label}: {props.value}</Label>
      <Slider value={[props.value]} min={props.min} max={props.max} step={props.step} onValueChange={([value]) => props.onChange(value)} />
    </div>
  );
}
