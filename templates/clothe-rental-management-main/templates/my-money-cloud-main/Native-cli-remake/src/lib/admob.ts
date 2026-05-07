import Constants from "expo-constants";
import { Platform } from "react-native";
import { TestIds } from "react-native-google-mobile-ads";

type AdmobExtra = {
  ADMOB_BANNER_UNIT_ID_ANDROID?: string;
  ADMOB_BANNER_UNIT_ID_IOS?: string;
  ADMOB_APP_OPEN_UNIT_ID_ANDROID?: string;
  ADMOB_APP_OPEN_UNIT_ID_IOS?: string;
};

const extra = ((Constants as any).expoConfig ?? (Constants as any).manifest)?.extra as AdmobExtra | undefined;

export function getBannerAdUnitId(): string {
  if (__DEV__) return TestIds.BANNER;
  const unitId =
    Platform.OS === "ios" ? extra?.ADMOB_BANNER_UNIT_ID_IOS : extra?.ADMOB_BANNER_UNIT_ID_ANDROID;
  return unitId || TestIds.BANNER;
}

export function getAppOpenAdUnitId(): string {
  if (__DEV__) return TestIds.APP_OPEN;
  const unitId =
    Platform.OS === "ios" ? extra?.ADMOB_APP_OPEN_UNIT_ID_IOS : extra?.ADMOB_APP_OPEN_UNIT_ID_ANDROID;
  return unitId || TestIds.APP_OPEN;
}
