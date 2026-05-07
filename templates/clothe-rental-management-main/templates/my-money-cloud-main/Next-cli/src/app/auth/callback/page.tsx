"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useI18n } from "@/lib/i18n";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      router.replace("/");
      return;
    }
    const supabase = getSupabaseBrowserClient();

    const finalize = async (message?: string | null) => {
      if (window.opener) {
        window.opener.postMessage(
          { type: "supabase-auth-complete", error: message ?? null },
          window.location.origin
        );
        window.close();
        return;
      }

      // Redirect to root, which will redirect to onboarding for check
      router.replace("/");
    };

    const run = async () => {
      let message: string | null = null;
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        const code = searchParams.get("code");
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            throw error;
          }
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            throw error;
          }
        }
      } catch (error) {
        message = error instanceof Error ? error.message : t("toast.saveFailed");
        setErrorMessage(message);
      } finally {
        await finalize(message);
      }
    };

    void run();
  }, [router, t]);

  return (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center px-4 py-10">
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">{t("auth.loading")}</p>
        {errorMessage ? (
          <p className="text-xs text-destructive">{errorMessage}</p>
        ) : null}
      </div>
    </div>
  );
}
