import { useEffect, useMemo, useState } from "react";
import * as RNIap from "react-native-iap";
import { getIapProductIds } from "@/lib/iap";

type IapState = {
  products: Record<string, RNIap.Product>;
  ready: boolean;
  error?: string;
};

export function useIap() {
  const [state, setState] = useState<IapState>({ products: {}, ready: false });
  const ids = useMemo(() => getIapProductIds(), []);
  const subscriptionIds = useMemo(() => [ids.monthly].filter(Boolean) as string[], [ids]);
  const productIds = useMemo(() => [ids.lifetime].filter(Boolean) as string[], [ids]);
  const allIds = useMemo(() => [...subscriptionIds, ...productIds], [subscriptionIds, productIds]);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        await RNIap.initConnection();
        if (!allIds.length) {
          if (mounted) setState({ products: {}, ready: true });
          return;
        }
        const map: Record<string, RNIap.Product> = {};
        if (productIds.length) {
          const products = await RNIap.getProducts({ skus: productIds });
          products.forEach((p) => {
            map[p.productId] = p;
          });
        }
        if (subscriptionIds.length) {
          const subs = await RNIap.getSubscriptions({ skus: subscriptionIds });
          subs.forEach((s) => {
            map[s.productId] = s;
          });
        }
        if (mounted) setState({ products: map, ready: true });
      } catch (error: any) {
        if (mounted) setState({ products: {}, ready: true, error: String(error?.message ?? error) });
      }
    };
    void init();
    return () => {
      mounted = false;
      void RNIap.endConnection();
    };
  }, [allIds.join(",")]);

  const purchase = async (productId: string) => {
    const isSubscription = subscriptionIds.includes(productId);
    const result = isSubscription
      ? await RNIap.requestSubscription({ sku: productId })
      : await RNIap.requestPurchase({ sku: productId });
    if (Array.isArray(result)) {
      for (const item of result) {
        await RNIap.finishTransaction({ purchase: item, isConsumable: false });
      }
    } else if (result) {
      await RNIap.finishTransaction({ purchase: result, isConsumable: false });
    }
  };

  const restore = async () => {
    const purchases = await RNIap.getAvailablePurchases();
    for (const purchase of purchases) {
      await RNIap.finishTransaction({ purchase, isConsumable: false });
    }
    return purchases;
  };

  return {
    ...state,
    purchase,
    restore,
    productIds: ids,
  };
}
