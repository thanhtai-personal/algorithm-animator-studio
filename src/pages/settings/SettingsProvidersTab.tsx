import { useEffect, useState } from "react";
import { RefreshCw, RotateCcw } from "lucide-react";
import { SystemLoader } from "@/components/ui/system-loader";
import { toast } from "sonner";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { t, type Lang  } from "@/lib/i18n";
import {
  getProviderStartupSettings,
  updateProviderStartupSetting,
  type ProviderStartupSettingsResponse,
  type StartupProviderId,
} from "@/lib/providerManagerApi";

type SettingsProvidersTabProps = {
  lang: Lang;
};

export function SettingsProvidersTab({ lang }: SettingsProvidersTabProps) {
  const [settings, setSettings] = useState<ProviderStartupSettingsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<StartupProviderId | null>(null);
  const [restartRequired, setRestartRequired] = useState(false);

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      setSettings(await getProviderStartupSettings());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t(lang, "uiCouldNotLoadProviders"));
    } finally {
      setLoading(false);
    }
  }

  async function toggleProvider(providerId: StartupProviderId, enabled: boolean) {
    setSavingId(providerId);
    try {
      const result = await updateProviderStartupSetting(providerId, enabled);
      setSettings((current) => current ? {
        ...current,
        restartRequired: true,
        envPath: result.envPath,
        providers: current.providers.map((provider) => provider.id === providerId ? result.provider : provider),
      } : current);
      setRestartRequired(true);
      toast.success(result.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t(lang, "uiCouldNotSaveProvider"));
    } finally {
      setSavingId(null);
    }
  }

  const providers = settings?.providers || [];

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h3 className="text-lg font-semibold">{t(lang, "uiProviderManager")}</h3>
        <Button variant="outline" onClick={refresh} disabled={loading}>
          {loading ? <SystemLoader className="mr-2 h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          {t(lang, "uiRefresh")}
        </Button>
      </div>

      {(restartRequired || settings?.restartRequired) ? (
        <Alert className="border-yellow-500/40 bg-yellow-500/10 text-yellow-100">
          <RotateCcw className="h-4 w-4" />
          <AlertTitle>{t(lang, "uiRestartRequired")}</AlertTitle>
        </Alert>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        {providers.map((provider) => (
          <div key={provider.id} className="flex items-start justify-between gap-4 rounded-lg border bg-card/40 p-3">
            <div className="min-w-0">
              <h4 className="font-medium">{provider.label}</h4>
            </div>
            <Switch
              checked={provider.enabled}
              disabled={savingId === provider.id}
              onCheckedChange={(checked) => void toggleProvider(provider.id, checked)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
