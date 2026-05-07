import { requestJson } from "@/lib/httpClient";
import type {
  ZaloMiniAppCreateSessionPayload,
  ZaloMiniAppSessionDto,
} from "@/lib/contracts";

export const zaloMiniAppAuthApiService = {
  createSession(payload: ZaloMiniAppCreateSessionPayload): Promise<ZaloMiniAppSessionDto> {
    return requestJson<ZaloMiniAppSessionDto>("/api/v1/auth/mini-app/session", {
      method: "POST",
      body: payload,
    });
  },
};
