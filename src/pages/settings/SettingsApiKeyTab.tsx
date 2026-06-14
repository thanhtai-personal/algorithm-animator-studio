import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      <CardContent className="space-y-5">
        <SecretInput
          id="ai-shorts-api-key"
          label={text(props.lang, "Gemini API key for AI Video Agent", "Gemini API key cho AI Video Agent")}
          description={text(props.lang, "Used only by the local backend to generate video plans/scripts. Leave empty to use local fallback scripts.", "Chỉ dùng bởi backend local để tạo plan/script video. Để trống thì agent dùng script fallback local.")}
          value={props.form.AI_SHORTS_API_KEY}
          placeholder="AIza..."
          onChange={(value) => props.onUpdateField("AI_SHORTS_API_KEY", value)}
        />
        <TextInput
          id="ai-agent-text-model"
          label={text(props.lang, "AI Agent text model", "Model text cho AI Agent")}
          description={text(props.lang, "Default: gemini-2.0-flash. This is separate from the Veo/video model setting.", "Mặc định: gemini-2.0-flash. Phần này tách riêng với cấu hình model Veo/video.")}
          value={props.form.AI_AGENT_TEXT_MODEL}
          placeholder="gemini-2.0-flash"
          onChange={(value) => props.onUpdateField("AI_AGENT_TEXT_MODEL", value)}
        />
        <TextInput
          id="ai-shorts-api-url"
          label={text(props.lang, "Gemini API base URL", "Gemini API base URL")}
          description={text(props.lang, "Usually keep the default Google Generative Language API URL.", "Thường giữ mặc định URL Google Generative Language API.")}
          value={props.form.AI_SHORTS_API_URL}
          placeholder="https://generativelanguage.googleapis.com/v1beta"
          onChange={(value) => props.onUpdateField("AI_SHORTS_API_URL", value)}
        />
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
