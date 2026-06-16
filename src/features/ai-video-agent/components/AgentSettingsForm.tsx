import { Play, Wand2 } from "lucide-react";
import { SystemLoader } from "@/components/ui/system-loader";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { text, type Lang } from "@/lib/i18n";
import type { AgentPreset, AgentVideoForm, AgentVideoPublishTarget } from "@/lib/aiVideoAgentApi";
import type { ElevenLabsConfig, PiperModel, RvcApplioConfig, SupertonicConfig, VieneuConfig } from "@/lib/voiceApi";
import type { AgentPublishChannelOption } from "../lib/publishChannelOptions";
import { AgentVoiceSettings } from "./AgentVoiceSettings";

type UpdateForm = <K extends keyof AgentVideoForm>(key: K, value: AgentVideoForm[K]) => void;

type AgentSettingsFormProps = {
  form: AgentVideoForm;
  lang: Lang;
  presets: AgentPreset[];
  models: PiperModel[];
  availableModels: PiperModel[];
  elevenConfig: ElevenLabsConfig | null;
  supertonicConfig: SupertonicConfig | null;
  rvcApplioConfig: RvcApplioConfig | null;
  vieneuConfig: VieneuConfig | null;
  publishOptions: AgentPublishChannelOption[];
  selectedPublishChannelKeys: string[];
  publishChannelWarning: string;
  loadingPlan: boolean;
  running: boolean;
  applyPreset: (id: string) => void;
  applyContentKind: (kind: AgentVideoForm["kind"]) => void;
  update: UpdateForm;
  togglePublishTarget: (target: AgentVideoPublishTarget, enabled: boolean) => void;
  togglePublishChannel: (key: string, enabled: boolean) => void;
  refreshPublishChannels: () => void;
  handleCreatePlan: () => void;
  handleRunNow: () => void;
  handleSaveDraft: () => void;
};

export function AgentSettingsForm(props: AgentSettingsFormProps) {
  const { form, lang, presets, models, availableModels, loadingPlan, running, applyPreset, applyContentKind, update } = props;
  return <div className="relative min-h-[calc(100vh-150px)] pb-28">
    <div className="space-y-4">
      <Field label={text(lang, "Content kind", "Loại nội dung")}><Select value={form.kind} disabled={running} onValueChange={(value) => applyContentKind(value as AgentVideoForm["kind"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="algorithm">Algorithm</SelectItem><SelectItem value="football">Football/MU</SelectItem><SelectItem value="story">Story</SelectItem><SelectItem value="generic">Generic</SelectItem></SelectContent></Select></Field>
      <Field label={text(lang, "Agent preset", "Agent preset")}><Select value={form.agentPreset || "custom"} onValueChange={applyPreset}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="custom">Custom</SelectItem>{presets.map((preset) => <SelectItem key={preset.id} value={preset.id}>{preset.title}</SelectItem>)}</SelectContent></Select></Field>
      <Field label={text(lang, "Video topic", "Chủ đề video")}><Input value={form.topic} onChange={(event) => update("topic", event.target.value)} /></Field>
      <Field label={text(lang, "Platform", "Nền tảng")}><Select value={form.platform} onValueChange={(value) => update("platform", value as AgentVideoForm["platform"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="youtube-short">YouTube Short 9:16</SelectItem><SelectItem value="youtube-long">YouTube Long 16:9</SelectItem><SelectItem value="tiktok">TikTok 9:16</SelectItem><SelectItem value="facebook-reel">Facebook Reel 9:16</SelectItem></SelectContent></Select></Field>
      <div className="grid gap-3 sm:grid-cols-2"><Field label={text(lang, "Language", "Ngôn ngữ")}><Select value={form.language} onValueChange={(value) => update("language", value as AgentVideoForm["language"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="vi">Tiếng Việt</SelectItem><SelectItem value="en">English</SelectItem></SelectContent></Select></Field><Field label={text(lang, "Target seconds", "Thời lượng giây")}><Input type="number" min={15} max={600} value={form.targetDurationSec} onChange={(event) => update("targetDurationSec", Number(event.target.value))} /></Field></div>
      <AgentVoiceSettings form={form} models={models} availableModels={availableModels} elevenConfig={props.elevenConfig} supertonicConfig={props.supertonicConfig} rvcApplioConfig={props.rvcApplioConfig} vieneuConfig={props.vieneuConfig} update={update} />
      <div className="grid gap-3 sm:grid-cols-2"><Field label={text(lang, "Speech rate", "Tốc độ đọc")}><Input type="number" step="0.05" value={form.speechRate} onChange={(event) => update("speechRate", Number(event.target.value))} /></Field><Field label={text(lang, "Sentence silence", "Nghỉ giữa câu")}><Input type="number" step="0.05" value={form.sentenceSilence} onChange={(event) => update("sentenceSilence", Number(event.target.value))} /></Field></div>
      <Field label="Tone"><Input value={form.tone} onChange={(event) => update("tone", event.target.value)} /></Field>
      <Field label={text(lang, "Extra instruction", "Yêu cầu thêm")}><Textarea value={form.extraInstruction} onChange={(event) => update("extraInstruction", event.target.value)} rows={4} /></Field>
      <PublishOptions {...props} />
    </div>
    <div className="absolute inset-x-0 bottom-0 z-10 rounded-b-lg border-t bg-card/95 p-3 shadow-[0_-12px_30px_rgba(2,6,23,0.35)] backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="grid gap-2 sm:grid-cols-3"><Button onClick={props.handleCreatePlan} disabled={loadingPlan || running} variant="outline">{loadingPlan ? <SystemLoader className="mr-2 h-4 w-4" /> : <Wand2 className="mr-2 h-4 w-4" />}{text(lang, "Create plan", "Tạo plan")}</Button><Button onClick={props.handleRunNow} disabled={running || loadingPlan || Boolean(props.publishChannelWarning)} className="sm:col-span-2">{running ? <SystemLoader className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}{text(lang, "Run full agent", "Chạy full agent")}</Button></div>
      <Button variant="ghost" className="mt-2 w-full" onClick={props.handleSaveDraft}>{text(lang, "Save draft job", "Lưu job nháp")}</Button>
    </div>
  </div>;
}

function PublishOptions({ form, lang, publishOptions, selectedPublishChannelKeys, publishChannelWarning, update, togglePublishTarget, togglePublishChannel, refreshPublishChannels }: AgentSettingsFormProps) {
  const targets: AgentVideoPublishTarget[] = ["youtube", "facebook", "tiktok", "instagram"];
  const selectedPlatforms = form.publishTargets || [];
  const visibleOptions = publishOptions.filter((option) => selectedPlatforms.includes(option.platform));
  return (
    <div className="rounded-lg border p-3">
      <label className="flex items-center gap-2 text-sm font-medium"><Checkbox checked={Boolean(form.autoCreatePublishJobs)} onCheckedChange={(value) => update("autoCreatePublishJobs", Boolean(value))} />{text(lang, "Create publish queue jobs after render", "Tạo publish job sau khi render")}</label>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">{targets.map((target) => <label key={target} className="flex items-center gap-2 text-sm"><Checkbox checked={selectedPlatforms.includes(target)} onCheckedChange={(value) => togglePublishTarget(target, Boolean(value))} />{target}</label>)}</div>
      <div className="mt-4 flex items-center justify-between gap-3"><Label>{text(lang, "Publish channels", "Kênh sẽ đăng")}</Label><Button type="button" size="sm" variant="outline" onClick={refreshPublishChannels}>{text(lang, "Refresh channels", "Tải lại kênh")}</Button></div>
      <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-md border p-2">
        {visibleOptions.length ? visibleOptions.map((option) => <label key={option.key} className={`flex items-start gap-2 rounded-md p-2 text-sm ${option.disabled ? "opacity-55" : "hover:bg-muted"}`} title={option.disabled ? option.disabledReason : option.subtitle}><Checkbox disabled={option.disabled} checked={selectedPublishChannelKeys.includes(option.key)} onCheckedChange={(value) => togglePublishChannel(option.key, Boolean(value))} /><span><span className="font-medium">{option.title}</span><span className="block text-xs text-muted-foreground">{option.subtitle}</span></span></label>) : <p className="p-2 text-xs text-muted-foreground">{text(lang, "No connected channel for the selected platform. Connect one in /channel first.", "Chưa có kênh đã kết nối cho nền tảng đã chọn. Hãy kết nối trong /channel trước.")}</p>}
      </div>
      {publishChannelWarning ? <p className="mt-2 rounded-md bg-destructive/10 p-2 text-xs text-destructive">{publishChannelWarning}</p> : null}
      <div className="mt-3 grid gap-3 sm:grid-cols-2"><Field label={text(lang, "Publish scheduled at", "Lịch đăng")}><Input type="datetime-local" value={form.publishScheduledAt || ""} onChange={(event) => update("publishScheduledAt", event.target.value)} /></Field><Field label={text(lang, "YouTube privacy", "Quyền riêng tư YouTube")}><Input value={form.publishPrivacyStatus || "private"} onChange={(event) => update("publishPrivacyStatus", event.target.value)} /></Field></div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
