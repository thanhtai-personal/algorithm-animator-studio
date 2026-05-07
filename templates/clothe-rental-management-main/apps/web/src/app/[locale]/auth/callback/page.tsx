"use client";

import { useI18n } from "@/lib/i18n";
import { useAuthCallbackPage } from "@/features/auth/hooks/callback/useAuthCallbackPage";

export default function AuthCallbackPage() {
  const { t } = useI18n();
  const { errorMessage } = useAuthCallbackPage();

  return (
    <div className="min-h-screen bg-gradient-background px-4 py-10">
      <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-6 text-center shadow-md">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        <p className="mt-4 text-sm text-muted-foreground">{t("auth.loading")}</p>
        {errorMessage ? (
          <p className="mt-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}
