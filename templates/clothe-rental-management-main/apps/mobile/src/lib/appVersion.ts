import Constants from "expo-constants";
import { Platform } from "react-native";

export function getAppVersion(): string {
  const expoConfig = (Constants as any).expoConfig ?? (Constants as any).manifest;
  const version = expoConfig?.version;
  if (typeof version === "string" && version.trim()) {
    return version.trim();
  }
  return "0.0.0";
}

export function getPlatformName(): "ios" | "android" {
  return Platform.OS === "ios" ? "ios" : "android";
}
