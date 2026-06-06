import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { text, type Lang } from "@/lib/i18n";
import type { RvcApplioTemplateFileResponse } from "./SettingsTypes";

type ApplioTemplateField = keyof Pick<
  RvcApplioTemplateFileResponse,
  "convertTemplatesJson" | "ttsTemplatesJson"
>;

type Props = {
  lang: Lang;
  templates: RvcApplioTemplateFileResponse;
  onUpdate: (key: ApplioTemplateField, value: string) => void;
};

const APPLIO_TEMPLATES_PLACEHOLDER = `[
  {
    "id": "voice-1",
    "label": "Voice 1",
    "apiName": "/infer_convert",
    "modelName": "logs/voice_1/voice_1.pth",
    "indexPath": "logs/voice_1/voice_1.index",
    "argTemplate": [0, "\${input}", "\${model}", "\${index}", "\${f0_method}", "\${index_rate}", "\${filter_radius}", 0, 0.25, "\${protect}", "wav"]
  }
]`;

const APPLIO_TTS_TEMPLATES_PLACEHOLDER = `[
  {
    "id": "vi-namminh-edge",
    "label": "Vietnamese NamMinh - Applio EdgeTTS",
    "apiName": "/infer_tts",
    "ttsVoice": "vi-VN-NamMinhNeural",
    "ttsSpeed": 0,
    "argTemplate": ["\${text}", "\${tts_voice}", "\${tts_speed}"]
  }
]`;

export function SettingsApplioTemplateFields(props: Props) {
  return (
    <div className="grid gap-4">
      <p className="text-xs text-muted-foreground">
        {text(props.lang, "Saved to", "Lưu tại")} <span className="font-mono">{props.templates.filePath}</span>
      </p>
      <TemplateTextarea
        id="rvc-applio-templates"
        label={text(props.lang, "Applio voice templates", "Danh sách template voice Applio")}
        description={text(props.lang, "JSON array. Each item is one selectable custom voice for Applio conversion.", "JSON array. Mỗi item là một custom voice có thể chọn khi chuyển voice bằng Applio.")}
        minHeight="220px"
        value={props.templates.convertTemplatesJson}
        placeholder={APPLIO_TEMPLATES_PLACEHOLDER}
        onChange={(value) => props.onUpdate("convertTemplatesJson", value)}
      />
      <TemplateTextarea
        id="rvc-applio-tts-templates"
        label={text(props.lang, "Applio TTS templates", "Danh sách template TTS Applio")}
        description={text(props.lang, "JSON array for Applio Text-to-Speech. Copy the exact argument order from Use via API.", "JSON array cho Text-to-Speech của Applio. Copy đúng thứ tự tham số từ Use via API.")}
        minHeight="180px"
        value={props.templates.ttsTemplatesJson}
        placeholder={APPLIO_TTS_TEMPLATES_PLACEHOLDER}
        onChange={(value) => props.onUpdate("ttsTemplatesJson", value)}
      />
    </div>
  );
}

function TemplateTextarea(props: { id: string; label: string; description: string; value: string; placeholder: string; minHeight?: string; onChange: (value: string) => void }) {
  return (
    <div>
      <Label htmlFor={props.id}>{props.label}</Label>
      <p className="mt-1 text-sm text-muted-foreground">{props.description}</p>
      <Textarea
        id={props.id}
        className="mt-2 font-mono text-xs"
        style={{ minHeight: props.minHeight || "120px" }}
        value={props.value}
        placeholder={props.placeholder}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </div>
  );
}
