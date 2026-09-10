import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { ThemeProvider } from "next-themes";
import { SettingsRemoteControlTab } from "@/pages/settings/SettingsRemoteControlTab";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { readSystemLang, writeSystemLang, type Lang } from "@/lib/i18n";
import { RemoteDesktopCard } from "./RemoteDesktopCard";

export default function RemoteApp() {
  const [lang, setLang] = useState<Lang>(() => readSystemLang("vi"));

  function changeLanguage(next: Lang) {
    writeSystemLang(next);
    setLang(next);
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="kai-remote.theme">
      <TooltipProvider>
        <Toaster />
        <main className="min-h-screen bg-background text-foreground">
          <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 md:px-8 md:py-10">
            <header className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-card/80 p-5 shadow-xl shadow-primary/5 backdrop-blur md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/15 p-3 text-primary">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">KAI Remote</h1>
                  <p className="text-sm text-muted-foreground">
                    {lang === "vi" ? "Điều khiển máy an toàn qua Telegram" : "Secure Telegram control for this computer"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2" aria-label="Language">
                <Button size="sm" variant={lang === "vi" ? "default" : "outline"} onClick={() => changeLanguage("vi")}>VI</Button>
                <Button size="sm" variant={lang === "en" ? "default" : "outline"} onClick={() => changeLanguage("en")}>EN</Button>
              </div>
            </header>

            <RemoteDesktopCard lang={lang} />
            <SettingsRemoteControlTab lang={lang} />
          </div>
        </main>
      </TooltipProvider>
    </ThemeProvider>
  );
}
