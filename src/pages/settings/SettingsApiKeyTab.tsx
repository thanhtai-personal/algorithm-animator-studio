import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { t, text, type Lang } from "@/lib/i18n";
import { SecretInput } from "./SettingsFields";
import type { SettingsForm, SettingsFormKey } from "./SettingsTypes";

type SettingsApiKeyTabProps = {
  form: SettingsForm;
  lang: Lang;
  onUpdateField: (key: SettingsFormKey, value: string) => void;
};

export function SettingsApiKeyTab(props: SettingsApiKeyTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(props.lang, "settingsApiKeyTab")}</CardTitle>
        <CardDescription>{t(props.lang, "settingsApiKeyDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">{text(props.lang, "AI Agent Flow", "AI Agent Flow")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {text(props.lang, "Used by the local AI Video Agent screen. The app stays local; only the selected AI provider API is called for research/script generation.", "Dùng cho màn hình AI Video Agent. App vẫn chạy local; chỉ gọi API provider AI đã chọn để tạo research/script.")}
          </p>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>{text(props.lang, "Agent text provider", "Provider text cho Agent")}</Label>
              <Select value={props.form.AI_AGENT_PROVIDER || "gemini"} onValueChange={(value) => props.onUpdateField("AI_AGENT_PROVIDER", value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">Gemini</SelectItem>
                  <SelectItem value="openai">OpenAI / OpenAI-compatible</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <SecretInput
              id="ai-shorts-api-key"
              label={text(props.lang, "Gemini API key", "Gemini API key")}
              description={text(props.lang, "Required when provider = Gemini. Used to generate the AiToEarn-style plan/script JSON.", "Bắt buộc khi provider = Gemini. Dùng để tạo plan/script JSON kiểu AiToEarn.")}
              value={props.form.AI_SHORTS_API_KEY}
              placeholder="AIza..."
              onChange={(value) => props.onUpdateField("AI_SHORTS_API_KEY", value)}
            />
            <TextInput id="ai-agent-text-model" label={text(props.lang, "Gemini text model", "Gemini text model")} description={text(props.lang, "Default: gemini-2.0-flash.", "Mặc định: gemini-2.0-flash.")} value={props.form.AI_AGENT_TEXT_MODEL} placeholder="gemini-2.0-flash" onChange={(value) => props.onUpdateField("AI_AGENT_TEXT_MODEL", value)} />
            <TextInput id="ai-shorts-api-url" label={text(props.lang, "Gemini API base URL", "Gemini API base URL")} description={text(props.lang, "Usually keep the default Google Generative Language API URL.", "Thường giữ mặc định URL Google Generative Language API.")} value={props.form.AI_SHORTS_API_URL} placeholder="https://generativelanguage.googleapis.com/v1beta" onChange={(value) => props.onUpdateField("AI_SHORTS_API_URL", value)} />
            <SecretInput
              id="openai-api-key"
              label={text(props.lang, "OpenAI / compatible API key", "OpenAI / compatible API key")}
              description={text(props.lang, "Required when provider = OpenAI. Compatible with OpenAI-style /chat/completions providers.", "Bắt buộc khi provider = OpenAI. Tương thích các provider có endpoint /chat/completions kiểu OpenAI.")}
              value={props.form.OPENAI_API_KEY}
              placeholder="sk-..."
              onChange={(value) => props.onUpdateField("OPENAI_API_KEY", value)}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <TextInput id="openai-base-url" label="OPENAI_BASE_URL" description={text(props.lang, "Default: https://api.openai.com/v1", "Mặc định: https://api.openai.com/v1")} value={props.form.OPENAI_BASE_URL} placeholder="https://api.openai.com/v1" onChange={(value) => props.onUpdateField("OPENAI_BASE_URL", value)} />
              <TextInput id="openai-chat-model" label="OPENAI_CHAT_MODEL" description={text(props.lang, "Model used for agent research/script when provider = OpenAI.", "Model dùng cho research/script khi provider = OpenAI.")} value={props.form.OPENAI_CHAT_MODEL} placeholder="gpt-4o-mini" onChange={(value) => props.onUpdateField("OPENAI_CHAT_MODEL", value)} />
            </div>
          </div>
        </div>
        <SecretInput
          id="elevenlabs-api-key"
          label={t(props.lang, "settingsElevenLabsApiKeyLabel")}
          description={t(props.lang, "settingsElevenLabsApiKeyDescription")}
          value={props.form.ELEVENLABS_API_KEY}
          placeholder="sk_..."
          onChange={(value) => props.onUpdateField("ELEVENLABS_API_KEY", value)}
        />
      </CardContent>
    </Card>
  );
}

function TextInput(props: { id: string; label: string; description: string; value: string; placeholder: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id}>{props.label}</Label>
      <p className="text-sm text-muted-foreground">{props.description}</p>
      <Input id={props.id} value={props.value} placeholder={props.placeholder} onChange={(event) => props.onChange(event.target.value)} />
    </div>
  );
}
