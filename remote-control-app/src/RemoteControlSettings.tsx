import { useEffect, useMemo, useState } from "react";
import { Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { t, type Lang } from "@/lib/i18n";
import {
  getRemoteControlSettings,
  updateRemoteControlSettings,
  type RemoteControlConfig,
  type RemoteControlSettingsResponse,
} from "./remoteControlApi";

type RemoteControlSettingsProps = {
  lang: Lang;
};

const EMPTY_CONFIG: RemoteControlConfig = {
  enabled: false,
  allowedUserIds: [],
  ollamaEnabled: false,
  ollamaBaseUrl: "http://127.0.0.1:11434",
  ollamaModel: "",
  allowPowerActions: false,
  appAliases: {},
};

export function RemoteControlSettings({ lang }: RemoteControlSettingsProps) {
  const [settings, setSettings] = useState<RemoteControlSettingsResponse | null>(null);
  const [draft, setDraft] = useState<RemoteControlConfig>(EMPTY_CONFIG);
  const [botToken, setBotToken] = useState("");
  const [allowedUsersText, setAllowedUsersText] = useState("");
  const [aliasesText, setAliasesText] = useState("");
  const [removeBotToken, setRemoveBotToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const runtimeLabel = useMemo(() => {
    if (!settings) return t(lang, "settingsRemoteNotLoaded");
    if (settings.runtime.running) {
      return settings.runtime.botUsername
        ? `@${settings.runtime.botUsername}`
        : t(lang, "settingsRemoteRunning");
    }
    return settings.runtime.lastError || t(lang, "settingsRemoteStopped");
  }, [lang, settings]);

  useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const response = await getRemoteControlSettings();
      applyResponse(response);
    } catch (error) {
      toast.error(toErrorMessage(error, t(lang, "settingsRemoteLoadFailed")));
    } finally {
      setLoading(false);
    }
  }

  function applyResponse(response: RemoteControlSettingsResponse) {
    setSettings(response);
    setDraft(response.config);
    setAllowedUsersText(response.config.allowedUserIds.join("\n"));
    setAliasesText(serializeAliases(response.config.appAliases));
    setBotToken("");
    setRemoveBotToken(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const response = await updateRemoteControlSettings({
        ...draft,
        allowedUserIds: parseAllowedUsers(allowedUsersText),
        appAliases: parseAliases(aliasesText),
        ...(botToken.trim() ? { botToken: botToken.trim() } : {}),
        removeBotToken,
      });
      applyResponse(response);
      toast.success(t(lang, "settingsRemoteSaved"));
    } catch (error) {
      toast.error(toErrorMessage(error, t(lang, "settingsRemoteSaveFailed")));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex min-h-40 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {t(lang, "settingsRemoteLoading")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>{t(lang, "settingsRemoteTitle")}</CardTitle>
          <Badge variant={settings?.runtime.running ? "default" : "secondary"}>
            {runtimeLabel}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {t(lang, "settingsRemoteDescription")}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {settings?.runtime.lastError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {settings.runtime.lastError}
          </div>
        ) : null}

        <section className="space-y-4 rounded-xl border border-border/70 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Label htmlFor="remote-enabled">{t(lang, "settingsRemoteEnabled")}</Label>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(lang, "settingsRemoteEnabledDescription")}
              </p>
            </div>
            <Switch
              id="remote-enabled"
              checked={draft.enabled}
              onCheckedChange={(enabled) => setDraft((current) => ({ ...current, enabled }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telegram-bot-token">{t(lang, "settingsRemoteBotToken")}</Label>
            <Input
              id="telegram-bot-token"
              type="password"
              autoComplete="off"
              value={botToken}
              placeholder={
                settings?.tokenConfigured && !removeBotToken
                  ? t(lang, "settingsRemoteTokenConfigured")
                  : t(lang, "settingsRemoteTokenPlaceholder")
              }
              onChange={(event) => {
                setBotToken(event.target.value);
                setRemoveBotToken(false);
              }}
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {t(lang, "settingsRemoteTokenDescription")}
              </p>
              {settings?.tokenConfigured ? (
                <Button
                  type="button"
                  size="sm"
                  variant={removeBotToken ? "destructive" : "outline"}
                  onClick={() => {
                    setRemoveBotToken((current) => !current);
                    setBotToken("");
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {removeBotToken
                    ? t(lang, "settingsRemoteKeepToken")
                    : t(lang, "settingsRemoteRemoveToken")}
                </Button>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telegram-allowed-users">{t(lang, "settingsRemoteAllowedUsers")}</Label>
            <Textarea
              id="telegram-allowed-users"
              value={allowedUsersText}
              placeholder={"123456789\n987654321"}
              rows={4}
              onChange={(event) => setAllowedUsersText(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {t(lang, "settingsRemoteAllowedUsersDescription")}
            </p>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-border/70 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Label htmlFor="remote-ollama-enabled">{t(lang, "settingsRemoteOllama")}</Label>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(lang, "settingsRemoteOllamaDescription")}
              </p>
            </div>
            <Switch
              id="remote-ollama-enabled"
              checked={draft.ollamaEnabled}
              onCheckedChange={(ollamaEnabled) => setDraft((current) => ({ ...current, ollamaEnabled }))}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              id="remote-ollama-url"
              label={t(lang, "settingsRemoteOllamaUrl")}
              value={draft.ollamaBaseUrl}
              placeholder="http://127.0.0.1:11434"
              onChange={(ollamaBaseUrl) => setDraft((current) => ({ ...current, ollamaBaseUrl }))}
            />
            <Field
              id="remote-ollama-model"
              label={t(lang, "settingsRemoteOllamaModel")}
              value={draft.ollamaModel}
              placeholder="qwen2.5:7b"
              onChange={(ollamaModel) => setDraft((current) => ({ ...current, ollamaModel }))}
            />
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-border/70 p-4">
          <div className="space-y-2">
            <Label htmlFor="remote-app-aliases">{t(lang, "settingsRemoteAppAliases")}</Label>
            <Textarea
              id="remote-app-aliases"
              value={aliasesText}
              placeholder={"chrome=C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe\nnotepad=notepad.exe"}
              rows={5}
              onChange={(event) => setAliasesText(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {t(lang, "settingsRemoteAppAliasesDescription")}
            </p>
          </div>

          <div className="flex items-start justify-between gap-4 rounded-lg border border-destructive/30 p-3">
            <div>
              <Label htmlFor="remote-power-actions">{t(lang, "settingsRemotePowerActions")}</Label>
              <p className="mt-1 text-sm text-muted-foreground">
                {t(lang, "settingsRemotePowerActionsDescription")}
              </p>
            </div>
            <Switch
              id="remote-power-actions"
              checked={draft.allowPowerActions}
              onCheckedChange={(allowPowerActions) => setDraft((current) => ({ ...current, allowPowerActions }))}
            />
          </div>
        </section>

        <div className="flex justify-end">
          <Button type="button" onClick={() => void handleSave()} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {t(lang, "settingsRemoteSave")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field(props: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id}>{props.label}</Label>
      <Input
        id={props.id}
        value={props.value}
        placeholder={props.placeholder}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </div>
  );
}

export function parseAllowedUsers(raw: string): string[] {
  return [...new Set(raw.split(/[\s,;]+/).map((item) => item.trim()).filter(Boolean))];
}

export function parseAliases(raw: string): Record<string, string> {
  const aliases: Record<string, string> = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      throw new Error(`Alias phải có dạng name=executable: ${trimmed}`);
    }

    const alias = trimmed.slice(0, separatorIndex).trim().toLowerCase();
    const executable = trimmed.slice(separatorIndex + 1).trim();
    if (!alias || !executable) throw new Error(`Alias không hợp lệ: ${trimmed}`);
    aliases[alias] = executable;
  }

  return aliases;
}

function serializeAliases(aliases: Record<string, string>): string {
  return Object.entries(aliases)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([alias, executable]) => `${alias}=${executable}`)
    .join("\n");
}

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
