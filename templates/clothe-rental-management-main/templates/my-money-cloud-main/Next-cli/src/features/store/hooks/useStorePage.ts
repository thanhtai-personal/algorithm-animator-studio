"use client";

import { useAnonymousChecker } from "@/hooks/useAnonymousChecker";
import { useOnlineChecker } from "@/hooks/useOnlineChecker";
import { getExchangeRates, convertUSD, formatPrice } from "@/lib/exchangeRate";
import { useI18n } from "@/lib/i18n";
import { useEffect } from "react";
import { useStorePackagesQuery } from "../queries/useStorePackagesQuery";
import { storePageStore } from "../stores/storePageStore";

export const useStorePage = () => {
  const { currency, localeCode } = useI18n();
  const { isOnline } = useOnlineChecker();
  const { isAnonymous } = useAnonymousChecker();
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
      } catch (error) {
        // fallback
      }
    };
    fetchExchangeRate();
  }, [currency]);

  const formatUSDPrice = (usdPrice: number) => {
    const amount = currency === "USD" ? usdPrice : convertUSD(usdPrice, currency, storePageStore.rates);
    return formatPrice(amount, currency, localeCode);
  };

  const handlePurchase = async (packageId: string) => {
    if (!isOnline) return;
    if (isAnonymous) {
      storePageStore.setShowLoginPrompt(true);
      return;
    }
    storePageStore.setProcessing(packageId);
    setTimeout(() => {
      storePageStore.setProcessing(null);
    }, 2000);
  };

  return {
    handlePurchase,
    isOnline,
    isAnonymous,
    formatUSDPrice,
  }
}