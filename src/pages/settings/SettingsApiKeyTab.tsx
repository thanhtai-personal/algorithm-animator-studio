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
        <SecretInput
          id="supertonic-base-url"
          label={t(props.lang, "settingsSupertonicBaseUrlLabel")}
          description={t(props.lang, "settingsSupertonicBaseUrlDescription")}
          value={props.form.SUPERTONIC_BASE_URL}
          placeholder="http://127.0.0.1:6688"
          type="text"
          onChange={(value) => props.onUpdateField("SUPERTONIC_BASE_URL", value)}
        />
        <SecretInput
          id="supertonic-model"
          label={t(props.lang, "settingsSupertonicModelLabel")}
          description={t(props.lang, "settingsSupertonicModelDescription")}
          value={props.form.SUPERTONIC_MODEL}
          placeholder="supertonic-3"
          type="text"
          onChange={(value) => props.onUpdateField("SUPERTONIC_MODEL", value)}
        />
      </CardContent>
    </Card>
  );
}
