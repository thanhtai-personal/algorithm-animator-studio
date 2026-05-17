import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { Field, PageHeader, SectionCard, StatusBadge } from "../AppHeader";
import {
  getAppServerPasskey,
  getDefaultDeviceName,
  getDeviceSettings,
  saveDeviceSettings,
} from "../../api/appServerSettingsApi";
import { selectServerDataDirectory } from "../../api/systemApi";
import {
  APP_SETTING_DEFINITIONS,
  APP_SETTING_GROUPS,
  DEFAULT_APP_SETTINGS,
  SENSITIVE_APP_SETTING_KEYS,
  type AppSettingGroupId,
} from "../../constants/appSettings";
import { useI18n, type TranslationKey } from "../../i18n";
import {
  getEffectiveAppSettings,
  saveAppSettings,
} from "../../utils/appSettingsStorage";

const DEVICE_ID_STORAGE_KEY = "kata.studio.deviceId";
const LOCAL_FALLBACK_PASSKEY = "020321";

const groupTitleKeys: Record<AppSettingGroupId, TranslationKey> = {
  appServer: "settingsTabAppServer",
  youtubeDefaults: "settingsTabYoutubeDefaults",
  aiShorts: "settingsTabAiShorts",
  elevenlabs: "settingsTabElevenLabs",
};

const groupDescriptionKeys: Record<AppSettingGroupId, TranslationKey> = {
  appServer: "settingsTabAppServerDesc",
  youtubeDefaults: "settingsTabYoutubeDefaultsDesc",
  aiShorts: "settingsTabAiShortsDesc",
  elevenlabs: "settingsTabElevenLabsDesc",
};

export function SettingsPage() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const [settings, setSettings] = useState(() => getEffectiveAppSettings());
  const [activeGroupId, setActiveGroupId] = useState<AppSettingGroupId>("appServer");
  const [savedMessage, setSavedMessage] = useState("");
  const [saveStatus, setSaveStatus] = useState<"success" | "error">("success");
  const [syncMessage, setSyncMessage] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [deviceName, setDeviceName] = useState("Local device");
  const [machineName, setMachineName] = useState("Local device");
  const [passkeyInput, setPasskeyInput] = useState("");
  const [newPasskey, setNewPasskey] = useState("");
  const [appServerUnlocked, setAppServerUnlocked] = useState(false);
  const [unlockMessage, setUnlockMessage] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [selectingDirectory, setSelectingDirectory] = useState(false);
  const [directoryMessage, setDirectoryMessage] = useState("");

  const activeGroup = APP_SETTING_GROUPS.find((group) => group.id === activeGroupId) || APP_SETTING_GROUPS[0];
  const serverDataDefinition = APP_SETTING_DEFINITIONS.find((definition) => definition.key === "SERVER_DATA_DIR");
  const activeDefinitions = APP_SETTING_DEFINITIONS.filter(
    (definition) => definition.groupId === activeGroup.id && definition.key !== "SERVER_DATA_DIR"
  );

  useEffect(() => {
    const nextDeviceId = getOrCreateDeviceId();
    setDeviceId(nextDeviceId);
    void hydrateDevice(nextDeviceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (isAppSettingGroupId(tab)) {
      setActiveGroupId(tab);
    }
  }, [searchParams]);


  function updateSetting(key: string, value: string) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
    setSavedMessage("");
    setSaveStatus("success");
    setSyncMessage("");
  }

  async function hydrateDevice(nextDeviceId: string) {
    try {
      const [machine, device] = await Promise.all([
        getDefaultDeviceName(),
        getDeviceSettings(nextDeviceId),
      ]);

      setMachineName(machine);
      setDeviceName(device?.deviceName || machine);

      if (device?.settings) {
        const mergedSettings = {
          ...DEFAULT_APP_SETTINGS,
          ...device.settings,
          ...getEffectiveAppSettings(),
        };
        setSettings(mergedSettings);
      }
    } catch {
      // App-server là tùy chọn. Nếu chưa bật, Settings vẫn chạy local bình thường.
    }
  }

  async function unlockAppServer() {
    const input = passkeyInput.trim();
    if (!input) {
      setUnlockMessage(t("settingsPasskeyRequired"));
      return;
    }

    try {
      const expectedPasskey = await getAppServerPasskey(deviceId);
      if (input !== expectedPasskey) {
        setUnlockMessage(t("settingsPasskeyInvalid"));
        return;
      }

      setAppServerUnlocked(true);
      setNewPasskey(expectedPasskey);
      setUnlockMessage(t("settingsPasskeyUnlocked"));
    } catch {
      if (input === LOCAL_FALLBACK_PASSKEY) {
        setAppServerUnlocked(true);
        setNewPasskey(LOCAL_FALLBACK_PASSKEY);
        setUnlockMessage(t("settingsPasskeyFallbackUnlocked"));
        return;
      }

      setUnlockMessage(t("settingsAppServerUnavailable"));
    }
  }

  async function chooseServerDataDirectory() {
    setSelectingDirectory(true);
    setDirectoryMessage("");

    try {
      const result = await selectServerDataDirectory();
      if (result.path) {
        updateSetting("SERVER_DATA_DIR", result.path);
        setDirectoryMessage(t("settingsDirectorySelected"));
      } else {
        setDirectoryMessage(t("settingsDirectorySelectionCancelled"));
      }
    } catch (error) {
      setDirectoryMessage(error instanceof Error ? error.message : t("settingsDirectorySelectionFailed"));
    } finally {
      setSelectingDirectory(false);
    }
  }

  async function save() {
    setSavedMessage("");
    setSyncMessage("");

    try {
      saveAppSettings(settings);
      setSaveStatus("success");
      setSavedMessage(t("settingsSaveSuccess"));
    } catch {
      setSaveStatus("error");
      setSavedMessage(t("settingsSaveFailure"));
      return;
    }

    if (activeGroupId !== "appServer" || !appServerUnlocked) {
      return;
    }

    setSyncing(true);

    try {
      const savedDevice = await saveDeviceSettings(
        deviceId,
        {
          deviceName,
          machineName,
          settings,
          passkey: newPasskey.trim() || undefined,
        }
      );

      setDeviceName(savedDevice.deviceName);
      setMachineName(savedDevice.machineName);
      setSyncMessage(t("settingsSyncedAppServer"));
    } catch {
      setSyncMessage(t("settingsSyncSkipped"));
    } finally {
      setSyncing(false);
    }
  }

  return (
    <>
      <PageHeader
        title={t("settingsTitle")}
        description={t("settingsDescription")}
        badge={<StatusBadge>{t("settingsVariableCount", { count: Object.keys(settings).length })}</StatusBadge>}
      />

      <div className="settingsTabs">
        <div className="settingsTabList" role="tablist" aria-label={t("settingsTabsLabel")}>
          {APP_SETTING_GROUPS.map((group) => {
            const isActive = activeGroupId === group.id;
            const missingCount = APP_SETTING_DEFINITIONS.filter(
              (definition) => definition.groupId === group.id && definition.sensitive && !settings[definition.key]?.trim()
            ).length;
            const isLocked = group.id === "appServer" && !appServerUnlocked;

            return (
              <button
                key={group.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`settingsTab ${isActive ? "active" : ""}`}
                onClick={() => setActiveGroupId(group.id)}
              >
                <span>{t(groupTitleKeys[group.id])}</span>
                <small>{isLocked ? t("settingsLocked") : missingCount ? t("settingsMissingCount", { count: missingCount }) : t("settingsReady")}</small>
              </button>
            );
          })}
        </div>

        {savedMessage || syncMessage ? (
          <section className="surface-card p-4 space-y-2">
            {savedMessage ? <p className={`text-sm ${saveStatus === "success" ? "text-success" : "text-destructive"}`}>{savedMessage}</p> : null}
            {syncMessage ? <p className="text-sm text-muted-foreground">{syncMessage}</p> : null}
          </section>
        ) : null}

        {activeGroup.id === "appServer" && serverDataDefinition ? (
          <section className="surface-card p-5 space-y-4">
            <div>
              <h2 className="text-lg font-display font-semibold">{t("settingsServerDataLocation")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("settingsServerDataLocationDesc")}</p>
            </div>
            <Field
              label={t("settingsServerDataLocation")}
              hint={serverDataDefinition.description}
              action={
                <button type="button" className="btn-ghost text-xs" onClick={() => void chooseServerDataDirectory()} disabled={selectingDirectory}>
                  {selectingDirectory ? t("settingsChoosingFolder") : t("settingsChooseFolder")}
                </button>
              }
            >
              <input
                className="input"
                value={settings.SERVER_DATA_DIR || ""}
                placeholder={serverDataDefinition.placeholder}
                onChange={(event) => updateSetting("SERVER_DATA_DIR", event.target.value)}
              />
            </Field>
            {directoryMessage ? <p className="text-sm text-muted-foreground">{directoryMessage}</p> : null}
          </section>
        ) : null}

        {activeGroup.id === "appServer" && !appServerUnlocked ? (
          <SectionCard title={t("settingsUnlockTitle")} description={t("settingsUnlockDescription")}>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label={t("settingsDeviceId")} hint={t("settingsDeviceIdHelp")}>
                <input className="input" value={deviceId} readOnly />
              </Field>
            </div>
            <Field label={t("settingsPasskey")} hint={t("settingsPasskeyHelp")}>
              <input
                className="input"
                type="password"
                value={passkeyInput}
                placeholder="******"
                onChange={(event) => setPasskeyInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void unlockAppServer();
                  }
                }}
              />
            </Field>
            <div className="stepActions">
              <button type="button" className="button" onClick={() => void unlockAppServer()}>
                {t("settingsUnlockButton")}
              </button>
            </div>
            {unlockMessage ? <p className="text-sm text-muted-foreground">{unlockMessage}</p> : null}
          </SectionCard>
        ) : (
          <section className="surface-card p-5 space-y-5">
            <div>
              <h2 className="text-xl font-display font-semibold">{t(groupTitleKeys[activeGroup.id])}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t(groupDescriptionKeys[activeGroup.id])}</p>
            </div>

            {activeGroup.id === "appServer" ? (
              <div className="grid md:grid-cols-3 gap-4 rounded-2xl border border-border bg-card/50 p-4">
                <Field label={t("settingsDeviceName")} hint={t("settingsDeviceNameHelp")}>
                  <input className="input" value={deviceName} onChange={(event) => setDeviceName(event.target.value)} />
                </Field>
                <Field label={t("settingsMachineName")}>
                  <input className="input" value={machineName} onChange={(event) => setMachineName(event.target.value)} />
                </Field>
                <Field label={t("settingsNewPasskey")} hint={t("settingsNewPasskeyHelp")}>
                  <input
                    className="input"
                    type="password"
                    value={newPasskey}
                    placeholder="******"
                    onChange={(event) => setNewPasskey(event.target.value)}
                  />
                </Field>
              </div>
            ) : null}

            <div className="grid md:grid-cols-2 gap-4">
              {activeDefinitions.map((definition) => {
                const isSensitive = SENSITIVE_APP_SETTING_KEYS.has(definition.key);
                const inputType = isSensitive ? "password" : definition.inputMode === "number" ? "text" : definition.inputMode || "text";
                const value = settings[definition.key] ?? "";

                if (definition.key === "ELEVENLABS_VOICES") {
                  return (
                    <ElevenLabsVoicesTable
                      key={definition.key}
                      value={value}
                      label={definition.label}
                      description={definition.description}
                      onChange={(nextValue) => updateSetting(definition.key, nextValue)}
                    />
                  );
                }

                return (
                  <Field
                    key={definition.key}
                    label={definition.label}
                    hint={
                      <span>
                        {definition.description}
                        {definition.defaultValue && !isSensitive ? (
                          <span className="block mt-1">
                            {t("settingsDefaultValue")} <code>{definition.defaultValue}</code>
                          </span>
                        ) : null}
                      </span>
                    }
                  >
                    {definition.multiline ? (
                      <textarea
                        className="input compactTextarea"
                        value={value}
                        placeholder={definition.placeholder}
                        onChange={(event) => updateSetting(definition.key, event.target.value)}
                      />
                    ) : (
                      <input
                        className="input"
                        type={inputType}
                        inputMode={definition.inputMode === "number" ? "numeric" : undefined}
                        value={value}
                        placeholder={definition.placeholder}
                        onChange={(event) => updateSetting(definition.key, event.target.value)}
                      />
                    )}
                  </Field>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <div className="settingsFloatingSave">
        <button type="button" className="button" onClick={save} disabled={syncing}>
          {syncing ? t("settingsSaving") : t("settingsSave")}
        </button>
      </div>
    </>
  );
}

type ElevenLabsVoiceRow = {
  id: string;
  label: string;
};

function ElevenLabsVoicesTable({
  value,
  label,
  description,
  onChange,
}: {
  value: string;
  label: string;
  description: string;
  onChange: (value: string) => void;
}) {
  const { t } = useI18n();
  const rows = parseVoiceRows(value);

  function commitRows(nextRows: ElevenLabsVoiceRow[]) {
    const cleanedRows = nextRows.map((row) => ({
      id: row.id.trim(),
      label: row.label.trim(),
    }));

    const hasValue = cleanedRows.some((row) => row.id || row.label);
    const shouldKeepEmptyRows = cleanedRows.length > 1;
    onChange(hasValue || shouldKeepEmptyRows ? JSON.stringify(cleanedRows, null, 2) : "");
  }

  function updateRow(index: number, field: keyof ElevenLabsVoiceRow, nextValue: string) {
    commitRows(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: nextValue } : row)));
  }

  function addRow() {
    commitRows([...rows, { id: "", label: "" }]);
  }

  function removeRow(index: number) {
    commitRows(rows.filter((_, rowIndex) => rowIndex !== index));
  }

  return (
    <div className="md:col-span-2 space-y-3">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-card/50 p-3">
        <div className="hidden md:grid grid-cols-[1fr_1fr_auto] gap-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
          <span>{t("settingsVoiceTableVoiceId")}</span>
          <span>{t("settingsVoiceTableVoiceLabel")}</span>
          <span />
        </div>

        {rows.map((row, index) => (
          <div key={index} className="grid md:grid-cols-[1fr_1fr_auto] gap-3">
            <input
              className="input"
              value={row.id}
              placeholder="voice_id"
              aria-label={t("settingsVoiceTableVoiceId")}
              onChange={(event) => updateRow(index, "id", event.target.value)}
            />
            <input
              className="input"
              value={row.label}
              placeholder={t("settingsVoiceTableVoiceLabel")}
              aria-label={t("settingsVoiceTableVoiceLabel")}
              onChange={(event) => updateRow(index, "label", event.target.value)}
            />
            <button type="button" className="btn-ghost px-3" onClick={() => removeRow(index)}>
              {t("settingsVoiceTableRemoveVoice")}
            </button>
          </div>
        ))}

        <button type="button" className="button" onClick={addRow}>
          {t("settingsVoiceTableAddVoice")}
        </button>
      </div>
    </div>
  );
}

function parseVoiceRows(value: string): ElevenLabsVoiceRow[] {
  if (!value.trim()) {
    return [{ id: "", label: "" }];
  }

  try {
    const parsed = JSON.parse(value) as Array<Partial<ElevenLabsVoiceRow>>;
    const rows = parsed
      .filter((row) => row && typeof row === "object")
      .map((row) => ({
        id: String(row.id || ""),
        label: String(row.label || ""),
      }));

    return rows.length ? rows : [{ id: "", label: "" }];
  } catch {
    return [{ id: "", label: "" }];
  }
}

function getOrCreateDeviceId() {
  if (typeof window === "undefined") {
    return "server-render-device";
  }

  const existingDeviceId = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (existingDeviceId) {
    return existingDeviceId;
  }

  const nextDeviceId = window.crypto?.randomUUID?.() || `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, nextDeviceId);
  return nextDeviceId;
}

function isAppSettingGroupId(value: string | null): value is AppSettingGroupId {
  return Boolean(value && APP_SETTING_GROUPS.some((group) => group.id === value));
}
