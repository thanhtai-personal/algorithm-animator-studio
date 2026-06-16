import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { text, type Lang } from "@/lib/i18n";
import { PathInput, SecretInput } from "./SettingsFields";
import type { SettingsForm, SettingsFormKey } from "./SettingsTypes";

type SettingsGptSoVitsFieldsProps = {
  form: SettingsForm;
  lang: Lang;
  selecting: string | null;
  onOpenPath: (targetPath: string) => void;
  onSelectPath: (kind: "directory" | "file", target: SettingsFormKey, title: string) => void;
  onUpdateField: (key: SettingsFormKey, value: string) => void;
};

export function SettingsGptSoVitsFields(props: SettingsGptSoVitsFieldsProps) {
  return (
    <div className="space-y-5">
      <p className="rounded-lg border border-yellow-400/40 bg-yellow-400/10 p-3 text-sm text-yellow-100">
        {text(props.lang, "GPT-SoVITS is an experimental local voice cloning provider. Keep it disabled in Settings > Provider until you need it because model loading can be heavy.", "GPT-SoVITS là provider clone giọng local thử nghiệm. Nên để tắt trong Cài đặt > Provider đến khi cần dùng vì load model khá nặng.")}
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <SecretInput id="gpt-sovits-base-url" label="GPT-SoVITS API base" description={text(props.lang, "Local API URL, usually http://127.0.0.1:9880.", "URL API local, thường là http://127.0.0.1:9880.")} value={props.form.GPT_SOVITS_BASE_URL} placeholder="http://127.0.0.1:9880" type="text" onChange={(value) => props.onUpdateField("GPT_SOVITS_BASE_URL", value)} />
        <SecretInput id="gpt-sovits-tts-endpoint" label="TTS endpoint" description={text(props.lang, "POST endpoint used by api_v2.py.", "Endpoint POST dùng bởi api_v2.py.")} value={props.form.GPT_SOVITS_TTS_ENDPOINT} placeholder="/tts" type="text" onChange={(value) => props.onUpdateField("GPT_SOVITS_TTS_ENDPOINT", value)} />
        <PathInput id="gpt-sovits-source-dir" label="GPT-SoVITS source/package" description={text(props.lang, "Folder containing GPT-SoVITS, optional when you start it with a .bat command.", "Thư mục GPT-SoVITS, không bắt buộc nếu chạy bằng file .bat.")} lang={props.lang} value={props.form.GPT_SOVITS_SOURCE_DIR} placeholder="C:/TOOLS/GPT-SoVITS" busy={props.selecting === "GPT_SOVITS_SOURCE_DIR"} onChange={(value) => props.onUpdateField("GPT_SOVITS_SOURCE_DIR", value)} onSelect={() => props.onSelectPath("directory", "GPT_SOVITS_SOURCE_DIR", "Select GPT-SoVITS folder")} onOpen={() => props.onOpenPath(props.form.GPT_SOVITS_SOURCE_DIR)} />
        <SecretInput id="gpt-sovits-start-command" label={text(props.lang, "Start command", "Lệnh chạy GPT-SoVITS")} description={text(props.lang, "Command used by npm run dev when provider is enabled. Example: C:/TOOLS/GPT-SoVITS/go-api.bat", "Lệnh npm run dev dùng khi provider được bật. Ví dụ: C:/TOOLS/GPT-SoVITS/go-api.bat")} value={props.form.GPT_SOVITS_START_COMMAND} placeholder="C:/TOOLS/GPT-SoVITS/go-api.bat" type="text" onChange={(value) => props.onUpdateField("GPT_SOVITS_START_COMMAND", value)} />
        <PathInput id="gpt-sovits-reference-audio" label={text(props.lang, "Default reference audio", "Audio mẫu mặc định")} description={text(props.lang, "WAV/MP3 reference voice used by default.", "File WAV/MP3 giọng mẫu dùng mặc định.")} lang={props.lang} value={props.form.GPT_SOVITS_REFERENCE_AUDIO} placeholder="C:/voices/my-reference.wav" busy={props.selecting === "GPT_SOVITS_REFERENCE_AUDIO"} onChange={(value) => props.onUpdateField("GPT_SOVITS_REFERENCE_AUDIO", value)} onSelect={() => props.onSelectPath("file", "GPT_SOVITS_REFERENCE_AUDIO", "Select GPT-SoVITS reference audio")} onOpen={() => props.onOpenPath(props.form.GPT_SOVITS_REFERENCE_AUDIO)} />
        <SecretInput id="gpt-sovits-text-lang" label={text(props.lang, "Text language", "Ngôn ngữ text")} description="en, zh, ja, ko, yue, auto" value={props.form.GPT_SOVITS_TEXT_LANG} placeholder="en" type="text" onChange={(value) => props.onUpdateField("GPT_SOVITS_TEXT_LANG", value)} />
        <SecretInput id="gpt-sovits-prompt-lang" label={text(props.lang, "Prompt language", "Ngôn ngữ audio mẫu")} description="en, zh, ja, ko, yue, auto" value={props.form.GPT_SOVITS_PROMPT_LANG} placeholder="en" type="text" onChange={(value) => props.onUpdateField("GPT_SOVITS_PROMPT_LANG", value)} />
        <SecretInput id="gpt-sovits-media-type" label="Media type" description="wav, ogg, aac, raw" value={props.form.GPT_SOVITS_MEDIA_TYPE} placeholder="wav" type="text" onChange={(value) => props.onUpdateField("GPT_SOVITS_MEDIA_TYPE", value)} />
        <SecretInput id="gpt-sovits-text-split" label="Text split method" description={text(props.lang, "Common default from GPT-SoVITS API: cut5.", "Mặc định thường dùng của GPT-SoVITS API: cut5.")} value={props.form.GPT_SOVITS_TEXT_SPLIT_METHOD} placeholder="cut5" type="text" onChange={(value) => props.onUpdateField("GPT_SOVITS_TEXT_SPLIT_METHOD", value)} />
        <SecretInput id="gpt-sovits-timeout" label="Timeout ms" description={text(props.lang, "First generation can be slow while models load.", "Lần tạo đầu có thể chậm vì cần load model.")} value={props.form.GPT_SOVITS_TIMEOUT_MS} placeholder="300000" type="text" onChange={(value) => props.onUpdateField("GPT_SOVITS_TIMEOUT_MS", value)} />
      </div>
      <div>
        <Label htmlFor="gpt-sovits-prompt-text">{text(props.lang, "Default prompt text", "Text khớp audio mẫu mặc định")}</Label>
        <p className="mt-1 text-sm text-muted-foreground">{text(props.lang, "Type the exact sentence spoken in the reference audio.", "Gõ đúng câu được nói trong audio mẫu.")}</p>
        <Textarea id="gpt-sovits-prompt-text" className="mt-2 min-h-[90px]" value={props.form.GPT_SOVITS_PROMPT_TEXT} placeholder="This is my reference voice." onChange={(event) => props.onUpdateField("GPT_SOVITS_PROMPT_TEXT", event.target.value)} />
      </div>
    </div>
  );
}
