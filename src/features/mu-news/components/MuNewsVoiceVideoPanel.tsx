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
    <Card className="border-border/70 shadow-[0_16px_40px_rgba(15,23,42,0.22)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Mic2 className="h-5 w-5 text-red-400" /> Piper voice & video nháp
        </CardTitle>
        <p className="text-sm text-muted-foreground">Dùng lại Piper local và endpoint render video hiện có trong source.</p>
      </CardHeader>
      <CardContent className="grid gap-5">
        <section className="grid gap-3 rounded-xl border border-border bg-muted/20 p-3">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
            <div className="grid gap-2">
              <Label>Model Piper</Label>
              <Select value={studio.piperModelKey} onValueChange={studio.setPiperModelKey}>
                <SelectTrigger><SelectValue placeholder="Chọn giọng" /></SelectTrigger>
                <SelectContent>
                  {modelOptions.map((model) => <SelectItem key={model.key} value={model.key}>{model.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Tên file audio</Label>
              <Input value={studio.fileName} onChange={(event) => studio.setFileName(event.target.value)} />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Nghỉ sau câu: {studio.sentenceSilence}s</Label>
              <Input type="number" step="0.05" min="0" max="3" value={studio.sentenceSilence} onChange={(event) => studio.setSentenceSilence(Number(event.target.value) || 0)} />
            </div>
            <div className="grid gap-2">
              <Label>Tốc độ đọc: {studio.speechRate}</Label>
              <Input type="number" step="0.05" min="0.5" max="1.4" value={studio.speechRate} onChange={(event) => studio.setSpeechRate(Number(event.target.value) || 0.9)} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={studio.createAudio} disabled={!studio.canGenerateAudio || !modelOptions.length}>
              <PlayCircle className="mr-2 h-4 w-4" /> {studio.loading.audio ? "Đang tạo voice..." : "Tạo voice Piper"}
            </Button>
            <Badge variant="outline">{modelOptions.length} model khả dụng</Badge>
            {studio.audioResult?.fileName ? <Badge>{studio.audioResult.fileName}</Badge> : null}
          </div>
          {studio.audioResult?.audioUrl ? <audio className="w-full" controls src={studio.audioResult.audioUrl} /> : null}
        </section>

        <section className="grid gap-3 rounded-xl border border-border bg-muted/20 p-3">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
            <div className="grid gap-2">
              <Label>Tên file video</Label>
              <Input value={studio.videoFileName} onChange={(event) => studio.setVideoFileName(event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Tỷ lệ</Label>
              <Select value={studio.aspectRatio} onValueChange={(value) => studio.setAspectRatio(value as "16:9" | "9:16")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">YouTube 16:9</SelectItem>
                  <SelectItem value="9:16">Shorts 9:16</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Fit nền</Label>
              <Select value={studio.fitMode} onValueChange={(value) => studio.setFitMode(value as "cover" | "contain")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cover">Cover</SelectItem>
                  <SelectItem value="contain">Contain</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-[180px_1fr]">
            <div className="grid gap-2">
              <Label>Loại nền</Label>
              <Select value={studio.backgroundType} onValueChange={(value) => studio.setBackgroundType(value as "image" | "gif" | "video")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Ảnh</SelectItem>
                  <SelectItem value="gif">GIF</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>File nền video</Label>
              <Input type="file" accept="image/*,video/*,.gif" onChange={(event) => studio.setBackgroundFile(event.target.files?.[0] || null)} />
            </div>
          </div>

          {studio.backgroundPreviewUrl ? (
            studio.backgroundType === "video"
              ? <video className="max-h-72 rounded-xl border border-border object-contain" controls src={studio.backgroundPreviewUrl} />
              : <img className="max-h-72 rounded-xl border border-border object-contain" src={studio.backgroundPreviewUrl} alt="Preview nền" />
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={studio.createVideo} disabled={!studio.canGenerateVideo}>
              <Video className="mr-2 h-4 w-4" /> {studio.loading.video ? "Đang render..." : "Render video nháp"}
            </Button>
            {studio.videoResult?.video.fileName ? <Badge>{studio.videoResult.video.fileName}</Badge> : null}
          </div>
          {studio.videoResult?.video.videoUrl ? <video className="w-full rounded-xl border border-border" controls src={studio.videoResult.video.videoUrl} /> : null}
        </section>
      </CardContent>
    </Card>
  );
}
