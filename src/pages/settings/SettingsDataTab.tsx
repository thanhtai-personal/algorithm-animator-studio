import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t, type Lang } from "@/lib/i18n";
import { text } from "@/lib/i18n";
import { PathInput } from "./SettingsFields";
import type { SettingsForm, SettingsFormKey } from "./SettingsTypes";

type SettingsDataTabProps = {
  form: SettingsForm;
  lang: Lang;
  selecting: string | null;
  onOpenPath: (targetPath: string) => void;
  onSelectPath: (kind: "directory" | "file", target: SettingsFormKey, title: string) => void;
  onUpdateField: (key: SettingsFormKey, value: string) => void;
};

export function SettingsDataTab(props: SettingsDataTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(props.lang, "settingsDataTab")}</CardTitle>
        <CardDescription>{t(props.lang, "settingsDataDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <PathInput
          id="server-data-dir"
          label={t(props.lang, "settingsServerDataDirLabel")}
          description={t(props.lang, "settingsServerDataDirDescription")}
          lang={props.lang}
          value={props.form.SERVER_DATA_DIR}
          placeholder="server/data"
          busy={props.selecting === "SERVER_DATA_DIR"}
          onChange={(value) => props.onUpdateField("SERVER_DATA_DIR", value)}
          onSelect={() => props.onSelectPath("directory", "SERVER_DATA_DIR", t(props.lang, "settingsSelectGeneratedDataFolder"))}
          onOpen={() => props.onOpenPath(props.form.SERVER_DATA_DIR)}
        />
        <PathInput
          id="music-library-dir"
          label={t(props.lang, "settingsMusicLibraryDirLabel")}
          description={t(props.lang, "settingsMusicLibraryDirDescription")}
          lang={props.lang}
          value={props.form.MUSIC_LIBRARY_DIR}
          placeholder="C:/Users/.../Music/youtube-audios"
          busy={props.selecting === "MUSIC_LIBRARY_DIR"}
          onChange={(value) => props.onUpdateField("MUSIC_LIBRARY_DIR", value)}
          onSelect={() => props.onSelectPath("directory", "MUSIC_LIBRARY_DIR", t(props.lang, "settingsSelectMusicLibraryFolder"))}
          onOpen={() => props.onOpenPath(props.form.MUSIC_LIBRARY_DIR)}
        />
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">{text(props.lang, "YouTube download", "Tải YouTube")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{text(props.lang, "If a cookies.txt file is selected, it is used instead of browser cookies.", "Nếu đã chọn file cookies.txt, hệ thống sẽ dùng file này thay cho cookie trình duyệt.")}</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <TextInput id="youtube-cookies-browser" label="YOUTUBE_COOKIES_FROM_BROWSER" description={text(props.lang, "Use browser cookies when YouTube asks to sign in. Example: chrome, edge, firefox.", "Dùng cookie trình duyệt khi YouTube yêu cầu đăng nhập. Ví dụ: chrome, edge, firefox.")} value={props.form.YOUTUBE_COOKIES_FROM_BROWSER} placeholder="chrome" onChange={(value) => props.onUpdateField("YOUTUBE_COOKIES_FROM_BROWSER", value)} />
            <TextInput id="youtube-js-runtime" label="YOUTUBE_JS_RUNTIME" description={text(props.lang, "JavaScript runtime for yt-dlp extraction. Default: node.", "JavaScript runtime cho yt-dlp khi đọc YouTube. Mặc định: node.")} value={props.form.YOUTUBE_JS_RUNTIME} placeholder="node" onChange={(value) => props.onUpdateField("YOUTUBE_JS_RUNTIME", value)} />
            <TextInput id="youtube-remote-components" label="YOUTUBE_REMOTE_COMPONENTS" description={text(props.lang, "Remote component source for yt-dlp JS challenge solving. Default: ejs:github.", "Nguồn remote component để yt-dlp giải JS challenge. Mặc định: ejs:github.")} value={props.form.YOUTUBE_REMOTE_COMPONENTS} placeholder="ejs:github" onChange={(value) => props.onUpdateField("YOUTUBE_REMOTE_COMPONENTS", value)} />
          </div>
          <div className="mt-4">
            <PathInput
              id="youtube-cookies-file"
              label="YOUTUBE_COOKIES_FILE"
              description={text(props.lang, "Optional cookies.txt exported from browser when cookies-from-browser cannot be used.", "File cookies.txt export từ trình duyệt, dùng khi không dùng được cookies-from-browser.")}
              lang={props.lang}
              value={props.form.YOUTUBE_COOKIES_FILE}
              placeholder="C:/Users/.../youtube-cookies.txt"
              busy={props.selecting === "YOUTUBE_COOKIES_FILE"}
              onChange={(value) => props.onUpdateField("YOUTUBE_COOKIES_FILE", value)}
              onSelect={() => props.onSelectPath("file", "YOUTUBE_COOKIES_FILE", text(props.lang, "Select YouTube cookies.txt", "Chọn file cookies.txt YouTube"))}
              onOpen={() => props.onOpenPath(props.form.YOUTUBE_COOKIES_FILE)}
            />
          </div>
        </div>
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
