import { zaloSdkService } from "@/features/platform/services/zaloSdkService";

function resolveOaIdFromEnv(): string | null {
  const value = import.meta.env.VITE_ZALO_OA_ID as string | undefined;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export const zaloMiniAppSupportService = {
  async openSupportWidget(): Promise<void> {
    await zaloSdkService.openOAWidget(resolveOaIdFromEnv());
  },
};
