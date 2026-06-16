import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, PlugZap, RefreshCw, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { readSystemLang, subscribeSystemLang, text, type Lang } from "@/lib/i18n";
import { getProviderStartupSettings, updateProviderStartupSetting, type ProviderStartupSettingsResponse, type StartupProviderId } from "@/lib/providerManagerApi";

export default function ProviderManager() {
  const [lang, setLang] = useState<Lang>(() => readSystemLang("en"));
  const [settings, setSettings] = useState<ProviderStartupSettingsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<StartupProviderId | null>(null);
  const [restartRequired, setRestartRequired] = useState(false);

  useEffect(() => subscribeSystemLang(setLang), []);
  useEffect(() => { void refresh(); }, []);

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
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 text-foreground">
      <header className="space-y-2">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <PlugZap className="h-6 w-6" /> {text(lang, "Provider Manager", "Quản lý provider")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {text(lang, "Turn heavy local providers on only when you need them, so app startup stays light.", "Chỉ bật provider local nặng khi cần dùng để app khởi động nhẹ hơn.")}
            </p>
          </div>
          <Button variant="outline" onClick={refresh} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {text(lang, "Refresh", "Tải lại")}
          </Button>
        </div>
      </header>

      {(restartRequired || settings?.restartRequired) ? (
        <Alert className="border-yellow-500/40 bg-yellow-500/10 text-yellow-100">
          <RotateCcw className="h-4 w-4" />
          <AlertTitle>{text(lang, "Restart required", "Cần khởi động lại app")}</AlertTitle>
          <AlertDescription>
            {text(lang, "Provider startup changes are saved, but they only take effect after restarting the app/dev server.", "Đã lưu thay đổi bật/tắt provider, nhưng chỉ có hiệu lực sau khi khởi động lại app/dev server.")}
          </AlertDescription>
        </Alert>
      ) : null}

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{text(lang, "Startup gate", "Chặn khởi động nặng")}</AlertTitle>
        <AlertDescription>
          {text(lang, "This screen controls auto-start only. Provider endpoint/model details are still configured in Settings → Voice.", "Màn hình này chỉ điều khiển tự khởi động. Endpoint/model của provider vẫn cấu hình ở Cài đặt → Voice.")}
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2">
        {providers.map((provider) => (
          <Card key={provider.id} className="overflow-hidden">
            <CardHeader className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">{provider.label}</CardTitle>
                  <CardDescription className="mt-1">{provider.description}</CardDescription>
                </div>
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
                {provider.heavy ? <Badge variant="secondary">{text(lang, "Heavy startup", "Khởi động nặng")}</Badge> : null}
                {!provider.defaultEnabled ? <Badge variant="outline">{text(lang, "Default off", "Mặc định tắt")}</Badge> : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">{provider.note}</p>
              <div className="rounded-lg bg-muted/40 p-3 font-mono text-xs text-muted-foreground">
                {provider.envKey}={provider.enabled ? "true" : "false"}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {settings?.envPath ? (
        <p className="break-all text-xs text-muted-foreground">
          {text(lang, "Saved to", "Lưu tại")}: {settings.envPath}
        </p>
      ) : null}
    </main>
  );
}
