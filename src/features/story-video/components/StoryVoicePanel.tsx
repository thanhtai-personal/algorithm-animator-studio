import { Loader2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import type { StoryVoiceProvider } from "../types";
import type { useStoryVideoStudio } from "../useStoryVideoStudio";
import { uiText } from "@/lib/i18n";

type StoryStudio = ReturnType<typeof useStoryVideoStudio>;

export function StoryVoicePanel({ studio }: { studio: StoryStudio }) {
  const availablePiperModels = studio.piperModels.filter((model) => model.available);

  return (
    <Card className="space-y-4 border-border/70 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.30)]">
      <div>
        <h2 className="flex items-center gap-2 font-semibold"><Volume2 className="h-4 w-4 text-emerald-400" /> {uiText("Voice đọc truyện")}</h2>
        <p className="text-xs text-muted-foreground">{uiText("Clone luồng TTS từ template: text → Piper/ElevenLabs → audio file.")}</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div>
          <Label>{uiText("Nguồn giọng")}</Label>
          <Select value={studio.provider} onValueChange={(value) => studio.setProvider(value as StoryVoiceProvider)}>
            <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="piper">{uiText("Piper local")}</SelectItem>
              <SelectItem value="elevenlabs">{uiText("ElevenLabs PRO")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{uiText("Tên file audio")}</Label>
          <Input className="mt-2" value={studio.fileName} onChange={(e) => studio.setFileName(e.target.value)} />
        </div>
        <div>
          <Label>{uiText("Số ký tự")}</Label>
          <div className="mt-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">{studio.characterCount.toLocaleString("vi-VN")}</div>
        </div>
      </div>

      {studio.provider === "piper" ? (
        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div>
            <Label>{uiText("Piper model")}</Label>
            <Select value={studio.piperModelKey} onValueChange={studio.setPiperModelKey}>
              <SelectTrigger className="mt-2"><SelectValue placeholder={uiText("Chọn model")} /></SelectTrigger>
              <SelectContent>
                {availablePiperModels.map((model) => <SelectItem key={model.key} value={model.key}>{model.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <SliderField label={uiText("Nghỉ giữa câu")} value={studio.sentenceSilence} min={0} max={2} step={0.05} suffix="s" onChange={studio.setSentenceSilence} />
          <SliderField label={uiText("Tốc độ đọc")} value={studio.speechRate} min={0.55} max={1.35} step={0.01} suffix="x" onChange={studio.setSpeechRate} />
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          <div>
            <Label>{uiText("ElevenLabs model")}</Label>
            <Select value={studio.elevenModelId} onValueChange={studio.setElevenModelId}>
              <SelectTrigger className="mt-2"><SelectValue placeholder={uiText("Chọn model PRO")} /></SelectTrigger>
              <SelectContent>
                {studio.elevenConfig?.models.map((model) => <SelectItem key={model.id} value={model.id}>{model.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{uiText("Voice ID")}</Label>
            <Select value={studio.elevenVoiceId} onValueChange={studio.setElevenVoiceId}>
              <SelectTrigger className="mt-2"><SelectValue placeholder={uiText("Chọn voice")} /></SelectTrigger>
              <SelectContent>
                {studio.elevenConfig?.voices.map((voice) => <SelectItem key={voice.id} value={voice.id}>{voice.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div>
        <Label>{uiText("Nội dung/kịch bản đọc truyện")}</Label>
        <Textarea className="mt-2 min-h-[320px] font-serif text-base leading-7" value={studio.text} onChange={(e) => studio.setText(e.target.value)} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button onClick={studio.generateAudio} disabled={!studio.canGenerateAudio} className="bg-emerald-500 text-slate-950 hover:bg-emerald-600">
          {studio.loading.audio ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Volume2 className="mr-2 h-4 w-4" />}
          Tạo audio đọc truyện
        </Button>
        {studio.audioResult?.audioUrl ? <audio controls src={studio.audioResult.audioUrl} className="h-10 flex-1" /> : null}
      </div>
    </Card>
  );
}

function SliderField(props: { label: string; value: number; min: number; max: number; step: number; suffix: string; onChange: (value: number) => void }) {
  return (
    <div>
      <Label>{props.label}: {props.value}{props.suffix}</Label>
      <Slider className="mt-4" value={[props.value]} min={props.min} max={props.max} step={props.step} onValueChange={([value]) => props.onChange(value)} />
    </div>
  );
}
