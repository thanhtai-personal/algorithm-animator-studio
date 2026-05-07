import { useI18n } from "@/lib/i18n";

export function OfflineOverlay() {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center space-y-2 px-4">
        <p className="text-lg font-semibold">{t("store.needsOnline") || "Store needs online"}</p>
        <p className="text-sm text-muted-foreground">
          {t("store.connectToAccess") || "Please connect to the internet to access the Store"}
        </p>
      </div>
    </div>
  );
}
