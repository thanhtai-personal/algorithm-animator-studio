import { useEffect } from "react";
import { useOnlineChecker } from "@/hooks/useOnlineChecker";
import { getExchangeRates } from "@/lib/exchangeRate";
import { useI18n } from "@/lib/i18n";
import { useStorePackagesQuery } from "@/features/store/queries/useStorePackagesQuery";
import { storePageStore } from "@/features/store/stores/storePageStore";
import { formatPrice } from "@/features/store/utils";

export function useStorePage() {
  const { currency, localeCode } = useI18n();
  const { isOnline } = useOnlineChecker();
  useStorePackagesQuery();

  useEffect(() => {
    const fetchExchangeRate = async () => {
      if (!currency || currency === "USD") {
        storePageStore.setRates({ USD: 1 });
        return;
      }
      try {
        const fetched = await getExchangeRates("USD", [currency]);
        if (fetched && fetched[currency]) {
          storePageStore.setRates(fetched);
        }
      } catch {
        // ignore
      }
    };
    void fetchExchangeRate();
  }, [currency]);

  const formatUSDPrice = (usdPrice: number) => {
    return formatPrice(usdPrice, currency, storePageStore.rates, localeCode);
  };

  const handlePurchase = async (packageId: string) => {
    if (!isOnline) return;
    storePageStore.setProcessing(packageId);
    setTimeout(() => {
      storePageStore.setProcessing(null);
    }, 1500);
  };

  return {
    handlePurchase,
    isOnline,
    formatUSDPrice,
  };
}
