import { requestJson } from "@/lib/httpClient";
import type { ZaloMiniAppConfigDto } from "@/lib/contracts";

export const platformApiService = {
  fetchConfig(): Promise<ZaloMiniAppConfigDto> {
    return requestJson<ZaloMiniAppConfigDto>("/api/v1/settings/public/mini-app-config");
  },
};
