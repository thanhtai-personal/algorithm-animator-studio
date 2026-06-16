import { useEffect, useState } from "react";
import { Loader2, PlugZap, RefreshCw, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { text, type Lang } from "@/lib/i18n";
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
      toast.error(error instanceof Error ? error.message : text(lang, "Could not load providers.", "Không tải được danh sách provider."));
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
      toast.error(error instanceof Error ? error.message : text(lang, "Could not save provider.", "Không lưu được provider."));
    } finally {
      setSavingId(null);
    }
  }

  const providers = settings?.providers || [];

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <PlugZap className="h-5 w-5" /> {text(lang, "Provider Manager", "Quản lý provider")}
        </h2>
        <Button variant="outline" onClick={refresh} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          {text(lang, "Refresh", "Tải lại")}
        </Button>
      </div>

      {(restartRequired || settings?.restartRequired) ? (
        <Alert className="border-yellow-500/40 bg-yellow-500/10 text-yellow-100">
          <RotateCcw className="h-4 w-4" />
          <AlertTitle>{text(lang, "Restart required", "Cần khởi động lại app")}</AlertTitle>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {providers.map((provider) => (
          <Card key={provider.id} className="overflow-hidden">
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-lg">{provider.label}</CardTitle>
                <Switch
                  checked={provider.enabled}
                  disabled={savingId === provider.id}
                  onCheckedChange={(checked) => void toggleProvider(provider.id, checked)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={provider.enabled ? "default" : "outline"}>
                  {provider.enabled ? text(lang, "Enabled", "Đang bật") : text(lang, "Disabled", "Đang tắt")}
                </Badge>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}
