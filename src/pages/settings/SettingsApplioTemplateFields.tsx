import { Pencil, Rows3 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    "id": "kai-voice-v1-convert",
    "label": "Kai voice v1 - Applio voice conversion",
    "apiName": "/enforce_terms",
    "modelName": "logs\\\\kai-voice-v1\\\\kai-voice-v1_100e_3400s.pth",
    "indexPath": "logs\\\\kai-voice-v1\\\\kai-voice-v1.index",
    "argTemplate": [true, "\${pitch}", "\${index_rate}", 1, "\${protect}", "\${f0_method}", "\${input_path}", "\${output}", "\${model}", "\${index}"]
  }
]`;

const APPLIO_TTS_TEMPLATES_PLACEHOLDER = `[
  {
    "id": "vi-namminh-edge",
    "label": "Vietnamese NamMinh - Applio EdgeTTS/RVC",
    "apiName": "/enforce_terms_2",
    "ttsVoice": "vi-VN-NamMinhNeural",
    "ttsSpeed": 0,
    "modelName": "logs\\\\kai-voice-v1\\\\kai-voice-v1_100e_3400s.pth",
    "indexPath": "logs\\\\kai-voice-v1\\\\kai-voice-v1.index",
    "argTemplate": [true, "", "\${text}", "\${tts_voice}", "\${tts_speed}", "\${pitch}", "\${index_rate}", 1, "\${protect}", "\${f0_method}", "\${tts_output}", "\${output}", "\${model}", "\${index}"]
  }
]`;

export function SettingsApplioTemplateFields(props: Props) {
  const [editing, setEditing] = useState<Record<ApplioTemplateField, boolean>>({
    convertTemplatesJson: false,
    ttsTemplatesJson: false,
  });

  return (
    <div className="grid gap-4">
      <TemplateJsonSection
        id="rvc-applio-templates"
        lang={props.lang}
        label={text(props.lang, "Applio voice templates", "Danh sách template voice Applio")}
        description={text(props.lang, "JSON array. Each item is one selectable custom voice for Applio conversion.", "JSON array. Mỗi item là một custom voice có thể chọn khi chuyển voice bằng Applio.")}
        editing={editing.convertTemplatesJson}
        minHeight="220px"
        mode="convert"
        value={props.templates.convertTemplatesJson}
        placeholder={APPLIO_TEMPLATES_PLACEHOLDER}
        onChange={(value) => props.onUpdate("convertTemplatesJson", value)}
        onToggleEditing={() => setEditing((value) => ({ ...value, convertTemplatesJson: !value.convertTemplatesJson }))}
      />
      <TemplateJsonSection
        id="rvc-applio-tts-templates"
        lang={props.lang}
        label={text(props.lang, "Applio TTS templates", "Danh sách template TTS Applio")}
        description={text(props.lang, "JSON array for Applio Text-to-Speech. Copy api_name and argument order from the Gradio /config dependencies.", "JSON array cho Text-to-Speech của Applio. Copy api_name và thứ tự tham số từ dependencies trong Gradio /config.")}
        editing={editing.ttsTemplatesJson}
        minHeight="180px"
        mode="tts"
        value={props.templates.ttsTemplatesJson}
        placeholder={APPLIO_TTS_TEMPLATES_PLACEHOLDER}
        onChange={(value) => props.onUpdate("ttsTemplatesJson", value)}
        onToggleEditing={() => setEditing((value) => ({ ...value, ttsTemplatesJson: !value.ttsTemplatesJson }))}
      />
    </div>
  );
}

function TemplateJsonSection(props: {
  id: string;
  lang: Lang;
  label: string;
  description: string;
  value: string;
  placeholder: string;
  editing: boolean;
  mode: "convert" | "tts";
  minHeight?: string;
  onChange: (value: string) => void;
  onToggleEditing: () => void;
}) {
  const parsed = parseTemplateItems(props.value);
  const showEditor = props.editing || Boolean(parsed.error);
  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Label htmlFor={props.id}>{props.label}</Label>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={props.onToggleEditing}>
          {showEditor ? <Rows3 className="mr-2 h-4 w-4" /> : <Pencil className="mr-2 h-4 w-4" />}
          {showEditor ? text(props.lang, "View list", "Xem danh sách") : text(props.lang, "Edit JSON", "Sửa JSON")}
        </Button>
      </div>

      {showEditor ? (
        <>
          {parsed.error ? <p className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-sm text-destructive">{parsed.error}</p> : null}
          <Textarea
            id={props.id}
            className="font-mono text-xs"
            style={{ minHeight: props.minHeight || "120px" }}
            value={props.value}
            placeholder={props.placeholder}
            onChange={(event) => props.onChange(event.target.value)}
          />
        </>
      ) : (
        <TemplateList lang={props.lang} items={parsed.items} mode={props.mode} onEdit={props.onToggleEditing} />
      )}
    </div>
  );
}

function TemplateList(props: { lang: Lang; items: TemplateItem[]; mode: "convert" | "tts"; onEdit: () => void }) {
  if (!props.items.length) {
    return (
      <div className="flex flex-col gap-3 rounded-md border border-dashed p-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">{text(props.lang, "No templates configured.", "Chưa cấu hình template.")}</p>
        <Button type="button" variant="outline" size="sm" onClick={props.onEdit}>
          <Pencil className="mr-2 h-4 w-4" /> {text(props.lang, "Edit JSON", "Sửa JSON")}
        </Button>
      </div>
    );
  }
  return (
    <div className="grid gap-2 md:grid-cols-2">
      {props.items.map((item, index) => (
        <div key={`${item.id}-${index}`} className="rounded-lg border p-3">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-medium">{item.label || item.id || `Template ${index + 1}`}</p>
              <p className="break-all text-xs text-muted-foreground">{item.id || "-"}</p>
            </div>
            <Badge variant="secondary">{item.apiName || "-"}</Badge>
          </div>
          <dl className="grid gap-1 text-xs text-muted-foreground">
            {props.mode === "tts" ? <Info label="TTS voice" value={item.ttsVoice} /> : null}
            {props.mode === "tts" ? <Info label="TTS speed" value={item.ttsSpeed} /> : null}
            {props.mode === "convert" ? <Info label="Model" value={item.modelName} /> : null}
            {props.mode === "convert" ? <Info label="Index" value={item.indexPath} /> : null}
            <Info label="Args" value={`${item.argTemplateLength} item${item.argTemplateLength === 1 ? "" : "s"}`} />
          </dl>
        </div>
      ))}
    </div>
  );
}

function Info(props: { label: string; value?: string | number }) {
  return (
    <div className="grid grid-cols-[78px_minmax(0,1fr)] gap-2">
      <dt>{props.label}</dt>
      <dd className="break-all text-foreground/90">{props.value ?? "-"}</dd>
    </div>
  );
}

type TemplateItem = {
  id: string;
  label: string;
  apiName: string;
  modelName?: string;
  indexPath?: string;
  ttsVoice?: string;
  ttsSpeed?: number;
  argTemplateLength: number;
};

function parseTemplateItems(value: string): { items: TemplateItem[]; error?: string } {
  try {
    const parsed = JSON.parse(value || "[]") as unknown;
    if (!Array.isArray(parsed)) return { items: [], error: "Template JSON must be an array." };
    return { items: parsed.map(toTemplateItem) };
  } catch (error) {
    return { items: [], error: error instanceof Error ? error.message : "Invalid JSON." };
  }
}

function toTemplateItem(value: unknown): TemplateItem {
  const record = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return {
    id: stringValue(record.id),
    label: stringValue(record.label || record.name),
    apiName: stringValue(record.apiName),
    modelName: stringValue(record.modelName),
    indexPath: stringValue(record.indexPath),
    ttsVoice: stringValue(record.ttsVoice),
    ttsSpeed: typeof record.ttsSpeed === "number" ? record.ttsSpeed : undefined,
    argTemplateLength: Array.isArray(record.argTemplate) ? record.argTemplate.length : 0,
  };
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}
