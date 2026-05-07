import { useI18n } from "@/lib/i18n";

export function OfflineNotice() {
  const { t } = useI18n();

  return (
    <div className="rounded-lg border border-dashed border-muted-foreground/40 bg-muted/70 p-4 text-sm text-muted-foreground">
      {t("common.offline") || "Offline"} · {t("store.offlineDisabled") || "Store purchases are disabled while offline."}
    </div>
  );
}
