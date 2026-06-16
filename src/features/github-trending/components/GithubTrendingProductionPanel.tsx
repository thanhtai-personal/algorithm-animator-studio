import type { ReactNode } from "react";
import { Music2, RefreshCw, Trash2, Volume2, Wand2 } from "lucide-react";
import { SystemLoader } from "@/components/ui/system-loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { AssetMusicOption, BackgroundMusicId } from "@/lib/backgroundMusic";
import type { MusicLibraryTrack } from "@/lib/musicLibrary";
import type { ElevenLabsConfig, PiperModel, RvcApplioConfig, SupertonicConfig, VieneuConfig, VoiceGenerateResult } from "@/lib/voiceApi";
import type { GithubTrendingOutputLanguage, GithubTrendingProductionSettings, GithubTrendingVoiceProvider } from "../types";

type Props = {
  production: GithubTrendingProductionSettings;
  generatedVoice: VoiceGenerateResult | null;
  voiceUrl: string;
  musicUrl: string;
  musicLabel: string;
  voiceLoading: boolean;
  catalogLoading: boolean;
  piperModels: PiperModel[];
  elevenLabsConfig: ElevenLabsConfig | null;
  supertonicConfig: SupertonicConfig | null;
  rvcApplioConfig: RvcApplioConfig | null;
  vieneuConfig: VieneuConfig | null;
  assetMusicOptions: AssetMusicOption[];
  musicTracks: MusicLibraryTrack[];
  updateProduction: (patch: Partial<GithubTrendingProductionSettings>) => void;
  generateVoiceOver: () => void;
  clearGeneratedVoice: () => void;
  reloadCatalogs: () => void;
};

const OUTPUT_LANGUAGES: Array<{ value: GithubTrendingOutputLanguage; label: string }> = [
  { value: "en", label: "English" },
  { value: "vi", label: "Tiếng Việt" },
  { value: "zh", label: "中文" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
];

const VOICE_PROVIDERS: Array<{ value: GithubTrendingVoiceProvider; label: string }> = [
  { value: "piper", label: "Piper local" },
  { value: "supertonic", label: "Supertonic" },
  { value: "vieneu", label: "VieNeu" },
  { value: "elevenlabs", label: "ElevenLabs" },
  { value: "applio", label: "Applio TTS" },
];

const PROCEDURAL_MUSIC: Array<{ value: BackgroundMusicId; label: string }> = [
  { value: "off", label: "Off" },
  { value: "lofi", label: "Lo-fi procedural" },
  { value: "ambient", label: "Ambient procedural" },
  { value: "chill", label: "Chill procedural" },
  { value: "upbeat", label: "Upbeat procedural" },
];

export function GithubTrendingProductionPanel(props: Props) {
  const piperModels = props.piperModels.filter((model) => model.available).length ? props.piperModels.filter((model) => model.available) : props.piperModels;
  return (
    <Card className="border-cyan-400/20 bg-gradient-to-br from-slate-950/60 via-background to-cyan-950/20">
      <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Volume2 className="h-5 w-5 text-cyan-300" /> Voice · Music · Language</CardTitle>
          <CardDescription>Chọn ngôn ngữ script, tạo voice-over và chọn nhạc nền trước khi render video.</CardDescription>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={props.reloadCatalogs} disabled={props.catalogLoading}>
          {props.catalogLoading ? <SystemLoader className="mr-2 h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />} Reload
        </Button>
      </CardHeader>
      <CardContent className="grid gap-5 xl:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-border/70 bg-muted/10 p-4">
          <Field label="Ngôn ngữ video/script">
            <Select value={props.production.outputLanguage} onValueChange={(value) => props.updateProduction({ outputLanguage: value as GithubTrendingOutputLanguage })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{OUTPUT_LANGUAGES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>

          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Voice provider">
              <Select value={props.production.voiceProvider} onValueChange={(value) => props.updateProduction({ voiceProvider: value as GithubTrendingVoiceProvider })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{VOICE_PROVIDERS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <VoiceProviderFields {...props} piperModels={piperModels} />
          </div>

          <Field label="Hoặc chọn voice audio URL có sẵn">
            <Input value={props.production.externalVoiceUrl} onChange={(event) => props.updateProduction({ externalVoiceUrl: event.target.value })} placeholder="/generated/2026-.../voice.wav hoặc https://..." />
          </Field>

          <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-2">
              <Label>Voice volume: {Math.round(props.production.voiceVolume * 100)}%</Label>
              <Slider min={0} max={1} step={0.05} value={[props.production.voiceVolume]} onValueChange={([voiceVolume]) => props.updateProduction({ voiceVolume })} />
            </div>
            <Button type="button" onClick={props.generateVoiceOver} disabled={props.voiceLoading}>
              {props.voiceLoading ? <SystemLoader className="mr-2 h-4 w-4" /> : <Wand2 className="mr-2 h-4 w-4" />} Tạo voice
            </Button>
          </div>

          {props.generatedVoice ? (
            <div className="space-y-2 rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="outline">{props.generatedVoice.fileName}</Badge>
                <Button type="button" size="sm" variant="ghost" onClick={props.clearGeneratedVoice}><Trash2 className="mr-2 h-4 w-4" /> Bỏ voice</Button>
              </div>
              <audio controls className="w-full" src={props.voiceUrl || props.generatedVoice.audioUrl} />
            </div>
          ) : props.voiceUrl ? <audio controls className="w-full" src={props.voiceUrl} /> : null}
        </div>

        <div className="space-y-4 rounded-xl border border-border/70 bg-muted/10 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold"><Music2 className="h-4 w-4 text-cyan-300" /> Nhạc nền</div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Nguồn nhạc">
              <Select value={props.production.musicMode} onValueChange={(value) => props.updateProduction({ musicMode: value as GithubTrendingProductionSettings["musicMode"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="procedural">Tạo nhạc procedural</SelectItem>
                  <SelectItem value="asset">Nhạc bundled</SelectItem>
                  <SelectItem value="library">Music library</SelectItem>
                  <SelectItem value="custom">Custom URL</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <MusicSelect {...props} />
          </div>

          {props.production.musicMode === "custom" ? (
            <Field label="Custom music URL">
              <Input value={props.production.customMusicUrl} onChange={(event) => props.updateProduction({ customMusicUrl: event.target.value })} placeholder="/background-music/... hoặc https://..." />
            </Field>
          ) : null}

          <div className="space-y-2">
            <Label>Music volume: {Math.round(props.production.musicVolume * 100)}%</Label>
            <Slider min={0} max={1} step={0.05} value={[props.production.musicVolume]} onValueChange={([musicVolume]) => props.updateProduction({ musicVolume })} />
          </div>

          <div className="rounded-lg border border-border/70 bg-background/40 p-3 text-sm">
            <div className="font-semibold">Selected: {props.musicLabel}</div>
            <p className="mt-1 text-xs text-muted-foreground">Nhạc asset/library/custom sẽ được đưa vào Remotion. Nhạc procedural dùng cho preview/ý tưởng, có thể đổi sang asset khi render chính thức.</p>
          </div>
          {props.musicUrl ? <audio controls loop className="w-full" src={props.musicUrl} /> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function VoiceProviderFields(props: Props & { piperModels: PiperModel[] }) {
  const provider = props.production.voiceProvider;
  if (provider === "piper") {
    return <SelectField label="Piper model" value={props.production.piperModelKey} onChange={(piperModelKey) => props.updateProduction({ piperModelKey })} options={props.piperModels.map((model) => ({ value: model.key, label: `${model.label}${model.available ? "" : " (missing)"}` }))} />;
  }
  if (provider === "supertonic") {
    return (
      <div className="grid gap-3 sm:grid-cols-2 md:col-span-2">
        <SelectField label="Supertonic voice/style" value={props.production.supertonicVoice} onChange={(supertonicVoice) => props.updateProduction({ supertonicVoice })} options={(props.supertonicConfig?.voices || []).map((voice) => ({ value: voice.id, label: voice.label }))} />
        <Field label="Steps"><Input type="number" min={5} max={12} value={props.production.supertonicTotalSteps} onChange={(event) => props.updateProduction({ supertonicTotalSteps: Number(event.target.value) })} /></Field>
      </div>
    );
  }
  if (provider === "elevenlabs") {
    return (
      <div className="grid gap-3 sm:grid-cols-2 md:col-span-2">
        <SelectField label="ElevenLabs model" value={props.production.elevenModelId} onChange={(elevenModelId) => props.updateProduction({ elevenModelId })} options={(props.elevenLabsConfig?.models || []).map((model) => ({ value: model.id, label: model.label }))} />
        <SelectField label="ElevenLabs voice" value={props.production.elevenVoiceId} onChange={(elevenVoiceId) => props.updateProduction({ elevenVoiceId })} options={(props.elevenLabsConfig?.voices || []).map((voice) => ({ value: voice.id, label: voice.label }))} />
      </div>
    );
  }
  if (provider === "applio") {
    return <SelectField label="Applio TTS template" value={props.production.applioTtsTemplateId} onChange={(applioTtsTemplateId) => props.updateProduction({ applioTtsTemplateId })} options={(props.rvcApplioConfig?.ttsTemplates || []).map((template) => ({ value: template.id, label: template.label || template.ttsVoice || template.id }))} />;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-3 md:col-span-2">
      <Field label="Mode"><Input value={props.production.vieneuMode} onChange={(event) => props.updateProduction({ vieneuMode: event.target.value })} placeholder={props.vieneuConfig?.mode || "turbo"} /></Field>
      <Field label="Emotion"><Input value={props.production.vieneuEmotion} onChange={(event) => props.updateProduction({ vieneuEmotion: event.target.value })} placeholder={props.vieneuConfig?.emotion || "natural"} /></Field>
      <Field label="Voice ID"><Input value={props.production.vieneuVoiceId} onChange={(event) => props.updateProduction({ vieneuVoiceId: event.target.value })} placeholder={props.vieneuConfig?.defaultVoiceId || "default"} /></Field>
    </div>
  );
}

function MusicSelect(props: Props) {
  if (props.production.musicMode === "asset") {
    return <SelectField label="Bundled music" value={props.production.musicPreset} onChange={(musicPreset) => props.updateProduction({ musicPreset: musicPreset as BackgroundMusicId })} options={props.assetMusicOptions.map((item) => ({ value: item.id, label: item.label.vi || item.label.en }))} />;
  }
  if (props.production.musicMode === "library") {
    return <SelectField label="Music library" value={props.production.musicPreset} onChange={(musicPreset) => props.updateProduction({ musicPreset: musicPreset as BackgroundMusicId })} options={props.musicTracks.map((track) => ({ value: track.id, label: track.title }))} />;
  }
  if (props.production.musicMode === "custom") return <Field label="Custom"><div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">Nhập URL bên dưới</div></Field>;
  return <SelectField label="Procedural preset" value={props.production.musicPreset} onChange={(musicPreset) => props.updateProduction({ musicPreset: musicPreset as BackgroundMusicId })} options={PROCEDURAL_MUSIC} />;
}

function SelectField(props: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  return (
    <Field label={props.label}>
      <Select value={props.value} onValueChange={props.onChange}>
        <SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger>
        <SelectContent>{props.options.length ? props.options.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>) : <SelectItem value="__empty" disabled>Chưa có dữ liệu</SelectItem>}</SelectContent>
      </Select>
    </Field>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
