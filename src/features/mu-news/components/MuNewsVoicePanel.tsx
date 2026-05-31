import { ArrowRight, Loader2, Mic2, Upload, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import type { StoryVoiceProvider } from "@/features/story-video/types";
import type { MuNewsVoiceSegment } from "../types";
import type { useMuNewsStudio } from "../useMuNewsStudio";

type MuNewsStudio = ReturnType<typeof useMuNewsStudio>;

export function MuNewsVoicePanel({ studio }: { studio: MuNewsStudio }) {
  const availableModels = studio.piperModels.filter((model) => model.available);

  return (
    <Card className="min-w-0 overflow-hidden border-border/70 shadow-[0_16px_40px_rgba(15,23,42,0.22)]">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-start gap-2 text-base leading-7 sm:text-lg">
              <Mic2 className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
              <span>Step 4 — Tạo voice nhiều đoạn</span>
            </CardTitle>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Chỉnh từng đoạn đọc, tạo audio Piper hoặc upload voice đã thu để ghép vào video timeline.
            </p>
          </div>
          <Button className="w-full sm:w-auto" onClick={studio.createAllAudioSegments} disabled={!studio.canGenerateAudio}>
            {studio.loading.audio ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Volume2 className="mr-2 h-4 w-4" />}
            Tạo tất cả voice
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid min-w-0 gap-4 p-4 pt-0 sm:p-6 sm:pt-0">
        <div className="grid min-w-0 gap-3 lg:grid-cols-[180px_minmax(0,1fr)_150px_150px]">
          <div className="grid min-w-0 gap-2">
            <Label>Nguồn giọng</Label>
            <Select value={studio.provider} onValueChange={(value) => studio.setProvider(value as StoryVoiceProvider)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="piper">Piper local</SelectItem>
                <SelectItem value="elevenlabs">ElevenLabs PRO</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {studio.provider === "piper" ? <div className="grid min-w-0 gap-2">
            <Label>Piper model mặc định</Label>
            <Select value={studio.piperModelKey} onValueChange={studio.setPiperModelKey}>
              <SelectTrigger><SelectValue placeholder="Chọn model" /></SelectTrigger>
              <SelectContent>
                {(availableModels.length ? availableModels : studio.piperModels).map((model) => (
                  <SelectItem key={model.key} value={model.key}>{model.label}{model.available ? "" : " · thiếu file"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div> : <ElevenLabsFields studio={studio} />}
          <SliderField label="Nghỉ giữa câu" value={studio.sentenceSilence} min={0} max={2} step={0.05} suffix="s" onChange={studio.setSentenceSilence} />
          <SliderField label="Tốc độ đọc" value={studio.speechRate} min={0.55} max={1.35} step={0.01} suffix="x" onChange={studio.setSpeechRate} />
        </div>

        <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Badge variant="secondary">{studio.voiceSegments.length} đoạn</Badge>
            <Badge variant="outline">{studio.generatedVoiceCount} đã tạo</Badge>
            <Badge variant="outline">{studio.selectedVoiceFileCount} file sẽ ghép</Badge>
          </div>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-muted/40">
            <Upload className="h-4 w-4" />
            <span className="truncate">Upload voice</span>
            <input type="file" multiple accept="audio/*,.wav,.mp3,.m4a,.aac,.ogg,.opus" className="hidden" onChange={(event) => studio.addUploadedVoiceFiles(event.target.files || [])} />
          </label>
        </div>

        <ScrollArea className="h-[58vh] min-h-[440px] rounded-xl border border-border bg-muted/10">
          <div className="grid min-w-0 gap-3 p-3 sm:p-4">
            {studio.voiceSegments.length ? studio.voiceSegments.map((segment) => (
              <VoiceSegmentCard key={segment.id} segment={segment} studio={studio} />
            )) : (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Chưa có đoạn voice. Quay lại Step 3 và bấm tách voice từ kịch bản.
              </div>
            )}
            {studio.uploadedVoices.map((voice) => (
              <div key={voice.id} className="grid min-w-0 gap-3 rounded-xl border border-border bg-background/70 p-3 sm:p-4">
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
                  <Checkbox checked={voice.selected} onCheckedChange={(checked) => studio.updateUploadedVoice(voice.id, checked === true)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{voice.title}</p>
                    <audio controls src={voice.previewUrl} className="mt-2 h-10 w-full" />
                  </div>
                  <Button className="w-full sm:w-auto" variant="outline" size="sm" onClick={() => studio.removeUploadedVoice(voice.id)}>Xóa</Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button className="w-full sm:w-auto" onClick={() => studio.setActiveStep("video")} disabled={!studio.selectedVoiceFileCount}>
            Sang Step 5 <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function VoiceSegmentCard({ segment, studio }: { segment: MuNewsVoiceSegment; studio: MuNewsStudio }) {
  const models = studio.piperModels.filter((model) => model.available);
  const selectableModels = models.length ? models : studio.piperModels;

  return (
    <article className="grid min-w-0 gap-3 rounded-xl border border-border bg-background/70 p-3 sm:p-4">
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start">
        <Checkbox checked={segment.selected} onCheckedChange={(checked) => studio.updateVoiceSegment(segment.id, { selected: checked === true })} />
        <div className="grid min-w-0 flex-1 gap-3">
          <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(180px,0.55fr)] xl:grid-cols-[minmax(0,1fr)_minmax(220px,0.65fr)_minmax(180px,0.5fr)]">
            <Input value={segment.title} onChange={(event) => studio.updateVoiceSegment(segment.id, { title: event.target.value })} />
            {studio.provider === "piper" ? <Select value={segment.modelKey || studio.piperModelKey} onValueChange={(modelKey) => studio.updateVoiceSegment(segment.id, { modelKey })}>
              <SelectTrigger><SelectValue placeholder="Chọn model voice" /></SelectTrigger>
              <SelectContent>
                {selectableModels.map((model) => (
                  <SelectItem key={model.key} value={model.key}>{model.label}{model.available ? "" : " · thiếu file"}</SelectItem>
                ))}
              </SelectContent>
            </Select> : <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">Dùng ElevenLabs đã chọn</div>}
            <Input value={segment.fileName} onChange={(event) => studio.updateVoiceSegment(segment.id, { fileName: event.target.value })} />
          </div>
          <Textarea className="min-h-36 min-w-0 resize-y text-sm leading-6" value={segment.text} onChange={(event) => studio.updateVoiceSegment(segment.id, { text: event.target.value })} />
          {segment.result?.audioUrl ? <audio controls src={segment.result.audioUrl} className="h-10 w-full" /> : null}
        </div>
        <Button className="w-full lg:w-auto" variant="outline" onClick={() => studio.createAudioSegment(segment.id)} disabled={studio.loading.audio || !segment.text.trim()}>
          {studio.loading.audio ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Volume2 className="mr-2 h-4 w-4" />}
          Tạo
        </Button>
      </div>
    </article>
  );
}

function ElevenLabsFields({ studio }: { studio: MuNewsStudio }) {
  return (
    <div className="grid min-w-0 gap-2 md:grid-cols-2 lg:col-span-1">
      <div className="grid min-w-0 gap-2">
        <Label>ElevenLabs model</Label>
        <Select value={studio.elevenModelId} onValueChange={studio.setElevenModelId}>
          <SelectTrigger><SelectValue placeholder="Chọn model PRO" /></SelectTrigger>
          <SelectContent>{studio.elevenConfig?.models.map((model) => <SelectItem key={model.id} value={model.id}>{model.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid min-w-0 gap-2">
        <Label>Voice ID</Label>
        <Select value={studio.elevenVoiceId} onValueChange={studio.setElevenVoiceId}>
          <SelectTrigger><SelectValue placeholder="Chọn voice" /></SelectTrigger>
          <SelectContent>{studio.elevenConfig?.voices.map((voice) => <SelectItem key={voice.id} value={voice.id}>{voice.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </div>
  );
}

function SliderField(props: { label: string; value: number; min: number; max: number; step: number; suffix: string; onChange: (value: number) => void }) {
  return (
    <div className="grid min-w-0 gap-2">
      <Label>{props.label}: {props.value}{props.suffix}</Label>
      <Slider value={[props.value]} min={props.min} max={props.max} step={props.step} onValueChange={([value]) => props.onChange(value)} />
    </div>
  );
}
