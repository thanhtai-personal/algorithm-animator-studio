import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Lang } from "@/lib/i18n";
import { SecretInput } from "./SettingsFields";
import type { SettingsForm, SettingsFormKey } from "./SettingsTypes";
import { txt } from "./settingsText";

type SettingsApiKeyTabProps = {
  form: SettingsForm;
  lang: Lang;
  onUpdateField: (key: SettingsFormKey, value: string) => void;
};

export function SettingsApiKeyTab(props: SettingsApiKeyTabProps) {
  const vi = props.lang === "vi";

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Key</CardTitle>
        <CardDescription>{txt(vi, "API key và cấu hình kết nối tới các voice provider local/cloud.", "API keys and connection settings for local/cloud voice providers.")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <SecretInput
          id="elevenlabs-api-key"
          label="ELEVENLABS_API_KEY"
          description={txt(vi, "API key dùng cho ElevenLabs PRO. Giá trị lưu local trong trình duyệt và gửi tới backend qua runtime header.", "API key for ElevenLabs PRO. The value is stored locally in the browser and sent to the backend through runtime headers.")}
          value={props.form.ELEVENLABS_API_KEY}
          placeholder="sk_..."
          onChange={(value) => props.onUpdateField("ELEVENLABS_API_KEY", value)}
        />
        <SecretInput
          id="supertonic-base-url"
          label="SUPERTONIC_BASE_URL"
          description={txt(vi, "URL của Supertonic local server, mặc định http://127.0.0.1:6688.", "URL of the local Supertonic server, default http://127.0.0.1:6688.")}
          value={props.form.SUPERTONIC_BASE_URL}
          placeholder="http://127.0.0.1:6688"
          type="text"
          onChange={(value) => props.onUpdateField("SUPERTONIC_BASE_URL", value)}
        />
        <SecretInput
          id="supertonic-model"
          label="SUPERTONIC_MODEL"
          description={txt(vi, "Model Supertonic cần dùng, ví dụ supertonic-3.", "Supertonic model to use, for example supertonic-3.")}
          value={props.form.SUPERTONIC_MODEL}
          placeholder="supertonic-3"
          type="text"
          onChange={(value) => props.onUpdateField("SUPERTONIC_MODEL", value)}
        />
      </CardContent>
    </Card>
  );
}
