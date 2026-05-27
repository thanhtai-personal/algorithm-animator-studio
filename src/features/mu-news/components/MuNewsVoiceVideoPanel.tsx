import { Mic2, PlayCircle, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { useMuNewsStudio } from "../useMuNewsStudio";

export function MuNewsVoiceVideoPanel({ studio }: { studio: ReturnType<typeof useMuNewsStudio> }) {
  const vietnameseModels = studio.piperModels.filter((model) => model.lang === "vi" && model.available);
  const modelOptions = vietnameseModels.length ? vietnameseModels : studio.piperModels.filter((model) => model.available);

  return (
    <Card className="min-w-0 overflow-hidden border-border/70 shadow-[0_16px_40px_rgba(15,23,42,0.22)]">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-start gap-2 text-base leading-7 sm:text-lg">
          <Mic2 className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          <span>Piper voice & video nháp</span>
        </CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">Dùng lại Piper local và endpoint render video hiện có trong source.</p>
      </CardHeader>
      <CardContent className="grid min-w-0 gap-4 p-4 pt-0 sm:gap-5 sm:p-6 sm:pt-0">
        <section className="grid min-w-0 gap-3 rounded-xl border border-border bg-muted/20 p-3 sm:p-4">
          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            <div className="grid min-w-0 gap-2">
              <Label>Model Piper</Label>
              <Select value={studio.piperModelKey} onValueChange={studio.setPiperModelKey}>
                <SelectTrigger className="min-w-0"><SelectValue placeholder="Chọn giọng" /></SelectTrigger>
                <SelectContent>
                  {modelOptions.map((model) => <SelectItem key={model.key} value={model.key}>{model.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid min-w-0 gap-2">
              <Label>Tên file audio</Label>
              <Input className="min-w-0" value={studio.fileName} onChange={(event) => studio.setFileName(event.target.value)} />
            </div>
          </div>
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <div className="grid min-w-0 gap-2">
              <Label>Nghỉ sau câu: {studio.sentenceSilence}s</Label>
              <Input type="number" step="0.05" min="0" max="3" value={studio.sentenceSilence} onChange={(event) => studio.setSentenceSilence(Number(event.target.value) || 0)} />
            </div>
            <div className="grid min-w-0 gap-2">
              <Label>Tốc độ đọc: {studio.speechRate}</Label>
              <Input type="number" step="0.05" min="0.5" max="1.4" value={studio.speechRate} onChange={(event) => studio.setSpeechRate(Number(event.target.value) || 0.9)} />
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Button className="w-full sm:w-auto" onClick={studio.createAudio} disabled={!studio.canGenerateAudio || !modelOptions.length}>
              <PlayCircle className="mr-2 h-4 w-4" /> {studio.loading.audio ? "Đang tạo voice..." : "Tạo voice Piper"}
            </Button>
            <Badge className="w-fit" variant="outline">{modelOptions.length} model khả dụng</Badge>
            {studio.audioResult?.fileName ? <Badge className="max-w-full truncate">{studio.audioResult.fileName}</Badge> : null}
          </div>
          {studio.audioResult?.audioUrl ? <audio className="w-full min-w-0" controls src={studio.audioResult.audioUrl} /> : null}
        </section>

        <section className="grid min-w-0 gap-3 rounded-xl border border-border bg-muted/20 p-3 sm:p-4">
          <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_160px_160px] xl:grid-cols-[minmax(0,1fr)_180px_180px]">
            <div className="grid min-w-0 gap-2">
              <Label>Tên file video</Label>
              <Input className="min-w-0" value={studio.videoFileName} onChange={(event) => studio.setVideoFileName(event.target.value)} />
            </div>
            <div className="grid min-w-0 gap-2">
              <Label>Tỷ lệ</Label>
              <Select value={studio.aspectRatio} onValueChange={(value) => studio.setAspectRatio(value as "16:9" | "9:16")}>
                <SelectTrigger className="min-w-0"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">YouTube 16:9</SelectItem>
                  <SelectItem value="9:16">Shorts 9:16</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid min-w-0 gap-2">
              <Label>Fit nền</Label>
              <Select value={studio.fitMode} onValueChange={(value) => studio.setFitMode(value as "cover" | "contain")}>
                <SelectTrigger className="min-w-0"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cover">Cover</SelectItem>
                  <SelectItem value="contain">Contain</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid min-w-0 gap-3 md:grid-cols-[160px_minmax(0,1fr)] xl:grid-cols-[180px_minmax(0,1fr)]">
            <div className="grid min-w-0 gap-2">
              <Label>Loại nền</Label>
              <Select value={studio.backgroundType} onValueChange={(value) => studio.setBackgroundType(value as "image" | "gif" | "video")}>
                <SelectTrigger className="min-w-0"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Ảnh</SelectItem>
                  <SelectItem value="gif">GIF</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid min-w-0 gap-2">
              <Label>File nền video</Label>
              <Input className="min-w-0 cursor-pointer file:mr-3 file:max-w-[45%] file:truncate" type="file" accept="image/*,video/*,.gif" onChange={(event) => studio.setBackgroundFile(event.target.files?.[0] || null)} />
            </div>
          </div>

          {studio.backgroundPreviewUrl ? (
            <div className="grid place-items-center rounded-xl border border-border bg-background/40 p-2">
              {studio.backgroundType === "video"
                ? <video className="max-h-[50vh] w-full rounded-lg object-contain" controls src={studio.backgroundPreviewUrl} />
                : <img className="max-h-[50vh] w-full rounded-lg object-contain" src={studio.backgroundPreviewUrl} alt="Preview nền" />}
            </div>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Button className="w-full sm:w-auto" onClick={studio.createVideo} disabled={!studio.canGenerateVideo}>
              <Video className="mr-2 h-4 w-4" /> {studio.loading.video ? "Đang render..." : "Render video nháp"}
            </Button>
            {studio.videoResult?.video.fileName ? <Badge className="max-w-full truncate">{studio.videoResult.video.fileName}</Badge> : null}
          </div>
          {studio.videoResult?.video.videoUrl ? (
            <div className="grid place-items-center rounded-xl border border-border bg-background/40 p-2">
              <video className="max-h-[70vh] w-full rounded-lg object-contain" controls src={studio.videoResult.video.videoUrl} />
            </div>
          ) : null}
        </section>
      </CardContent>
    </Card>
  );
}
