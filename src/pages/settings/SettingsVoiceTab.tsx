import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Lang } from "@/lib/i18n";
import { PathInput, SecretInput, VoiceRowsTable, type VoiceRow } from "./SettingsFields";
import type { SettingsForm, SettingsFormKey } from "./SettingsTypes";
import { txt } from "./settingsText";

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
  const vi = props.lang === "vi";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Voice</CardTitle>
        <CardDescription>{txt(vi, "Đường dẫn Piper, voice mapping và thông số voice mặc định.", "Piper paths, voice mapping, and default voice settings.")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <PathInput
          id="model-dir"
          label="MODEL_DIR"
          description={txt(vi, "Thư mục chứa các file model .onnx và .onnx.json.", "Folder containing .onnx and .onnx.json model files.")}
          lang={props.lang}
          value={props.form.MODEL_DIR}
          placeholder="models"
          busy={props.selecting === "MODEL_DIR"}
          onChange={(value) => props.onUpdateField("MODEL_DIR", value)}
          onSelect={() => props.onSelectPath("directory", "MODEL_DIR", txt(vi, "Chọn thư mục chứa Piper models", "Select the Piper models folder"))}
          onOpen={() => props.onOpenPath(props.form.MODEL_DIR)}
        />
        <PathInput
          id="piper-exe"
          label="PIPER_EXE"
          description={txt(vi, "Đường dẫn tới piper.exe, ví dụ models/.venv/Scripts/piper.exe.", "Path to piper.exe, for example models/.venv/Scripts/piper.exe.")}
          lang={props.lang}
          value={props.form.PIPER_EXE}
          placeholder="models/.venv/Scripts/piper.exe"
          busy={props.selecting === "PIPER_EXE"}
          onChange={(value) => props.onUpdateField("PIPER_EXE", value)}
          onSelect={() => props.onSelectPath("file", "PIPER_EXE", txt(vi, "Chọn piper.exe", "Select piper.exe"))}
          onOpen={() => props.onOpenPath(props.form.PIPER_EXE)}
        />
        <VoiceRowsTable rows={props.voiceRows} lang={props.lang} onAdd={props.onAddVoiceRow} onUpdate={props.onUpdateVoiceRow} onRemove={props.onRemoveVoiceRow} />
        <div className="grid gap-3 md:grid-cols-2">
          <SecretInput
            id="supertonic-default-voice"
            label="SUPERTONIC_DEFAULT_VOICE"
            description={txt(vi, "Voice mặc định, ví dụ M1/F1 hoặc custom voice đã import.", "Default voice, for example M1/F1 or an imported custom voice.")}
            value={props.form.SUPERTONIC_DEFAULT_VOICE}
            placeholder="M1"
            type="text"
            onChange={(value) => props.onUpdateField("SUPERTONIC_DEFAULT_VOICE", value)}
          />
          <SecretInput
            id="supertonic-total-steps"
            label="SUPERTONIC_TOTAL_STEPS"
            description={txt(vi, "Chất lượng 5-12, mặc định 8.", "Quality from 5-12, default 8.")}
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
