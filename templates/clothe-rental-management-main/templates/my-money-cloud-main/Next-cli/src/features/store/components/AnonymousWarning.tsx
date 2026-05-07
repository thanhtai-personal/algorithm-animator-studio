import { useI18n } from "@/lib/i18n";

export function AnonymousWarning() {
  const { t } = useI18n();
  return (
    <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-4 space-y-2">
      <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
        ⚠️ {t("store.anonymousWarning") || "Guest Mode Warning"}
      </p>
      <p className="text-xs text-yellow-600 dark:text-yellow-300">
        {t("store.anonymousWarningDesc") || "Purchases are saved to this device only. Sign in to backup and restore on other devices."}
      </p>
    </div>
  );
}
