import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { t, type Lang } from "@/lib/i18n";
import { PathInput, SecretInput, VoiceRowsTable, type VoiceRow } from "./SettingsFields";
import type { SettingsForm, SettingsFormKey } from "./SettingsTypes";

type SettingsVoiceTabProps = {
  form: SettingsForm;
  lang: Lang;
  selecting: string | null;
  voiceRows: VoiceRow[];
  onAddVoiceRow: () => void;
  onOpenPath: (targetPath: string) => void;
  onRemoveVoiceRow: (index: number) => void;
  onSelectPath: (kind: "directory" | "file", target: SettingsFormKey, title: string) => void;
  onUpdateField: (key: SettingsFormKey, value: string) => void;
  onUpdateVoiceRow: (index: number, patch: Partial<VoiceRow>) => void;
};

export function SettingsVoiceTab(props: SettingsVoiceTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(props.lang, "settingsVoiceTab")}</CardTitle>
        <CardDescription>{t(props.lang, "settingsVoiceDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <PathInput
          id="model-dir"
          label={t(props.lang, "settingsModelDirLabel")}
          description={t(props.lang, "settingsModelDirDescription")}
          lang={props.lang}
          value={props.form.MODEL_DIR}
          placeholder="models"
          busy={props.selecting === "MODEL_DIR"}
          onChange={(value) => props.onUpdateField("MODEL_DIR", value)}
          onSelect={() => props.onSelectPath("directory", "MODEL_DIR", t(props.lang, "settingsSelectPiperModelsFolder"))}
          onOpen={() => props.onOpenPath(props.form.MODEL_DIR)}
        />
        <PathInput
          id="piper-exe"
          label={t(props.lang, "settingsPiperExeLabel")}
          description={t(props.lang, "settingsPiperExeDescription")}
          lang={props.lang}
          value={props.form.PIPER_EXE}
          placeholder="models/.venv/Scripts/piper.exe"
          busy={props.selecting === "PIPER_EXE"}
          onChange={(value) => props.onUpdateField("PIPER_EXE", value)}
          onSelect={() => props.onSelectPath("file", "PIPER_EXE", t(props.lang, "settingsSelectPiperExe"))}
          onOpen={() => props.onOpenPath(props.form.PIPER_EXE)}
        />
        <VoiceRowsTable rows={props.voiceRows} lang={props.lang} onAdd={props.onAddVoiceRow} onUpdate={props.onUpdateVoiceRow} onRemove={props.onRemoveVoiceRow} />
        <div className="grid gap-3 md:grid-cols-2">
          <SecretInput
            id="supertonic-default-voice"
            label={t(props.lang, "settingsSupertonicDefaultVoiceLabel")}
            description={t(props.lang, "settingsDefaultVoiceDescription")}
            value={props.form.SUPERTONIC_DEFAULT_VOICE}
            placeholder="M1"
            type="text"
            onChange={(value) => props.onUpdateField("SUPERTONIC_DEFAULT_VOICE", value)}
          />
          <SecretInput
            id="supertonic-total-steps"
            label={t(props.lang, "settingsSupertonicTotalStepsLabel")}
            description={t(props.lang, "settingsTotalStepsDescription")}
            value={props.form.SUPERTONIC_TOTAL_STEPS}
            placeholder="8"
            type="text"
            onChange={(value) => props.onUpdateField("SUPERTONIC_TOTAL_STEPS", value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
