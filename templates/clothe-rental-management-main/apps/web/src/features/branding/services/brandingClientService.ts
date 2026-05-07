"use client";

import { buildNestApiUrl } from "@/lib/api/nestApiClient";
import type { PublicSiteBrandingDto } from "@/types/settingsModule";

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as { error?: string } & T;

  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed");
  }

  return payload;
}

export const brandingClientService = {
  async fetchPublicBranding(): Promise<PublicSiteBrandingDto> {
    const response = await fetch(
      buildNestApiUrl("/api/v1/settings/public/site-branding"),
      {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      }
    );

    return parseJsonResponse<PublicSiteBrandingDto>(response);
  },
};
