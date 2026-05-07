import Constants from "expo-constants";

export type IapProductIds = {
  monthly?: string;
  lifetime?: string;
};

export function getIapProductIds(): IapProductIds {
  const expoConfig = (Constants as any).expoConfig ?? (Constants as any).manifest;
  const extra = expoConfig?.extra ?? {};
  return {
    monthly: extra.IAP_NO_ADS_MONTHLY,
    lifetime: extra.IAP_NO_ADS_LIFETIME,
  };
}
