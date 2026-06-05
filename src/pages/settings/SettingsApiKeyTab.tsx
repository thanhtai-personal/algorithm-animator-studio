import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { t, type Lang } from "@/lib/i18n";
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
