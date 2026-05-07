import { AdPackagesSection } from "./components/AdPackagesSection";
import { observer } from "mobx-react-lite";
import { useStorePage } from "./hooks/useStorePage";
import { LoginPromptDialog } from "./components/LoginPromptDialog";
import { OfflineOverlay } from "./components/OfflineOverlay";
import { AnonymousWarning } from "./components/AnonymousWarning";
import { OfflineNotice } from "./components/OfflineNotice";
import { useI18n } from "@/lib/i18n";

export const StorePage = observer(function StorePage() {
  const { t } = useI18n();
  const {
    handlePurchase,
    isOnline,
    isAnonymous,
    formatUSDPrice,
  } = useStorePage();

  return (
    <div className="space-y-8 pb-32 relative">
      <LoginPromptDialog />
      {!isOnline && <OfflineOverlay />}
      {(isOnline || isAnonymous)  && <AnonymousWarning />}
      {!isOnline && <OfflineNotice />}
      <div className="space-y-1">
        <h2 className="text-xl font-bold">{t("store.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("store.subtitle")}</p>
      </div>
      <AdPackagesSection formatPrice={formatUSDPrice} handlePurchase={handlePurchase} isOnline={isOnline} />
    </div>
  );
});

