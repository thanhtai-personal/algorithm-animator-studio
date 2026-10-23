import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { t, type Lang } from "@/lib/i18n";
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
      </CardHeader>
      <CardContent className="space-y-5">
        <PathInput
          id="server-data-dir"
          label={t(props.lang, "settingsServerDataDirLabel")}
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
          lang={props.lang}
          value={props.form.MUSIC_LIBRARY_DIR}
          placeholder="C:/Users/.../Music/youtube-audios"
          busy={props.selecting === "MUSIC_LIBRARY_DIR"}
          onChange={(value) => props.onUpdateField("MUSIC_LIBRARY_DIR", value)}
          onSelect={() => props.onSelectPath("directory", "MUSIC_LIBRARY_DIR", t(props.lang, "settingsSelectMusicLibraryFolder"))}
          onOpen={() => props.onOpenPath(props.form.MUSIC_LIBRARY_DIR)}
        />
      </CardContent>
    </Card>
  );
}
