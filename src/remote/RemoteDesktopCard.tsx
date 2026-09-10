import { useEffect, useState } from "react";
import { Laptop, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Lang } from "@/lib/i18n";
import {
  readRemoteDesktopPreferences,
  setRemoteLaunchAtLogin,
  type RemoteDesktopPreferences,
} from "./remoteDesktopBridge";

const COPY = {
  vi: {
    title: "Ứng dụng Windows",
    desktop: "Desktop",
    browser: "Trình duyệt",
    launch: "Khởi động cùng Windows",
    launchHelp: "KAI Remote sẽ chạy ẩn trong system tray sau khi bạn đăng nhập Windows.",
    tray: "Đóng cửa sổ sẽ giữ bot chạy trong system tray.",
    unavailable: "Tùy chọn này chỉ khả dụng trong app KAI Remote đã đóng gói cho Windows.",
    saveError: "Không thay đổi được thiết lập khởi động cùng Windows.",
  },
  en: {
    title: "Windows app",
    desktop: "Desktop",
    browser: "Browser",
    launch: "Start with Windows",
    launchHelp: "KAI Remote starts hidden in the system tray after you sign in to Windows.",
    tray: "Closing the window keeps the bot running in the system tray.",
    unavailable: "This option is only available in the packaged KAI Remote app for Windows.",
    saveError: "Could not update the Windows startup setting.",
  },
} as const;

export function RemoteDesktopCard({ lang }: { lang: Lang }) {
  const copy = COPY[lang];
  const [preferences, setPreferences] = useState<RemoteDesktopPreferences | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void readRemoteDesktopPreferences().then(setPreferences).catch(() => {
      setPreferences({ launchAtLogin: false, packaged: false, platform: "web", startupSupported: false });
    });
  }, []);

  async function updateLaunchAtLogin(enabled: boolean) {
    setSaving(true);
    try {
      setPreferences(await setRemoteLaunchAtLogin(enabled));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.saveError);
    } finally {
      setSaving(false);
    }
  }

  const startupSupported = Boolean(preferences?.startupSupported);

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Laptop className="h-5 w-5 text-primary" />
            {copy.title}
          </CardTitle>
          <Badge variant={preferences?.packaged ? "default" : "secondary"}>
            {preferences?.packaged ? copy.desktop : copy.browser}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{copy.tray}</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between gap-4 rounded-xl border border-border/70 p-4">
          <div>
            <Label htmlFor="remote-launch-at-login">{copy.launch}</Label>
            <p className="mt-1 text-sm text-muted-foreground">
              {startupSupported ? copy.launchHelp : copy.unavailable}
            </p>
          </div>
          {preferences ? (
            <Switch
              id="remote-launch-at-login"
              checked={preferences.launchAtLogin}
              disabled={!startupSupported || saving}
              onCheckedChange={(enabled) => void updateLaunchAtLogin(enabled)}
            />
          ) : (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
