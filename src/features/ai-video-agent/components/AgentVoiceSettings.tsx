import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AgentVideoForm, AgentVoiceProvider } from "@/lib/aiVideoAgentApi";
import type { ElevenLabsConfig, PiperModel, RvcApplioConfig, SupertonicConfig, VieneuConfig } from "@/lib/voiceApi";

type Props = {
  form: AgentVideoForm;
  models: PiperModel[];
  availableModels: PiperModel[];
  elevenConfig: ElevenLabsConfig | null;
  supertonicConfig: SupertonicConfig | null;
  rvcApplioConfig: RvcApplioConfig | null;
  vieneuConfig: VieneuConfig | null;
  update: <K extends keyof AgentVideoForm>(key: K, value: AgentVideoForm[K]) => void;
};

const PROVIDERS: Array<{ value: AgentVoiceProvider; label: string }> = [
  { value: "piper", label: "Piper local" },
  { value: "elevenlabs", label: "ElevenLabs" },
  { value: "supertonic", label: "Supertonic" },
  { value: "vieneu", label: "VieNeu" },
  { value: "applio", label: "Applio TTS" },
];

export function AgentVoiceSettings({ form, models, availableModels, elevenConfig, supertonicConfig, rvcApplioConfig, vieneuConfig, update }: Props) {
  const piperModels = availableModels.length ? availableModels : models;
  const provider = form.voiceProvider || "piper";
  return (
    <div className="space-y-3 rounded-lg border p-3">
      <VoiceField label="Voice provider">
        <Select value={provider} onValueChange={(value) => update("voiceProvider", value as AgentVoiceProvider)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{PROVIDERS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
        </Select>
      </VoiceField>

      {provider === "piper" ? (
        <VoiceField label="Piper voice model">
          <Select value={form.piperModelKey} onValueChange={(value) => update("piperModelKey", value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{piperModels.map((model) => <SelectItem key={model.key} value={model.key}>{model.label}{model.available ? "" : " (missing)"}</SelectItem>)}</SelectContent>
          </Select>
        </VoiceField>
      ) : null}

      {provider === "elevenlabs" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <VoiceField label="ElevenLabs model">
            <Select value={form.elevenModelId} onValueChange={(value) => update("elevenModelId", value)}>
              <SelectTrigger><SelectValue placeholder="Chọn model" /></SelectTrigger>
              <SelectContent>{(elevenConfig?.models || []).map((model) => <SelectItem key={model.id} value={model.id}>{model.label}</SelectItem>)}</SelectContent>
            </Select>
          </VoiceField>
          <VoiceField label="ElevenLabs voice">
            <Select value={form.elevenVoiceId} onValueChange={(value) => update("elevenVoiceId", value)}>
              <SelectTrigger><SelectValue placeholder="Chọn voice" /></SelectTrigger>
              <SelectContent>{(elevenConfig?.voices || []).map((voice) => <SelectItem key={voice.id} value={voice.id}>{voice.label}</SelectItem>)}</SelectContent>
            </Select>
          </VoiceField>
        </div>
      ) : null}

      {provider === "supertonic" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <VoiceField label="Supertonic voice/style">
            <Select value={form.supertonicVoice} onValueChange={(value) => update("supertonicVoice", value)}>
              <SelectTrigger><SelectValue placeholder="Chọn voice/style" /></SelectTrigger>
              <SelectContent>{(supertonicConfig?.voices || []).map((voice) => <SelectItem key={voice.id} value={voice.id}>{voice.label}</SelectItem>)}</SelectContent>
            </Select>
          </VoiceField>
          <VoiceField label="Supertonic steps">
            <Input type="number" min={5} max={12} value={form.supertonicTotalSteps} onChange={(event) => update("supertonicTotalSteps", Number(event.target.value))} />
          </VoiceField>
        </div>
      ) : null}

      {provider === "vieneu" ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <VoiceField label="VieNeu mode">
            <Input value={form.vieneuMode || vieneuConfig?.mode || "turbo"} onChange={(event) => update("vieneuMode", event.target.value)} />
          </VoiceField>
          <VoiceField label="Emotion">
            <Input value={form.vieneuEmotion || vieneuConfig?.emotion || "natural"} onChange={(event) => update("vieneuEmotion", event.target.value)} />
          </VoiceField>
          <VoiceField label="Voice ID">
            <Input value={form.vieneuVoiceId} onChange={(event) => update("vieneuVoiceId", event.target.value)} placeholder={vieneuConfig?.defaultVoiceId || "default"} />
          </VoiceField>
        </div>
      ) : null}

      {provider === "applio" ? (
        <VoiceField label="Applio TTS template">
          <Select value={form.applioTtsTemplateId} onValueChange={(value) => update("applioTtsTemplateId", value)}>
            <SelectTrigger><SelectValue placeholder="Chọn Applio TTS template" /></SelectTrigger>
            <SelectContent>{(rvcApplioConfig?.ttsTemplates || []).map((template) => <SelectItem key={template.id} value={template.id}>{template.label || template.ttsVoice || template.id}</SelectItem>)}</SelectContent>
          </Select>
        </VoiceField>
      ) : null}
    </div>
  );
}

function VoiceField({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
