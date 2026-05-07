import {
  DEFAULT_SITE_LOGO_DARK_URL,
  DEFAULT_SITE_LOGO_URL,
} from "@/features/branding/constants";
import { buildNestApiUrl } from "@/lib/api/nestApiClient";
import type { PublicSiteBrandingDto } from "@/types/settingsModule";

const DEFAULT_PUBLIC_BRANDING: PublicSiteBrandingDto = {
  siteLogoUrl: DEFAULT_SITE_LOGO_URL,
  siteLogoDarkUrl: DEFAULT_SITE_LOGO_DARK_URL,
  isMakeupModuleEnabled: true,
};

function toPublicSiteBranding(payload: unknown): PublicSiteBrandingDto {
  if (!payload || typeof payload !== "object") {
    return { ...DEFAULT_PUBLIC_BRANDING };
  }

  const source = payload as Record<string, unknown>;
  return {
    siteLogoUrl:
      typeof source.siteLogoUrl === "string" && source.siteLogoUrl.trim().length > 0
        ? source.siteLogoUrl
        : null,
    siteLogoDarkUrl:
      typeof source.siteLogoDarkUrl === "string" && source.siteLogoDarkUrl.trim().length > 0
        ? source.siteLogoDarkUrl
        : null,
    isMakeupModuleEnabled:
      typeof source.isMakeupModuleEnabled === "boolean"
        ? source.isMakeupModuleEnabled
        : DEFAULT_PUBLIC_BRANDING.isMakeupModuleEnabled,
  };
}

export async function getPublicSiteBrandingFromNest(): Promise<PublicSiteBrandingDto> {
  const url = buildNestApiUrl("/api/v1/settings/public/site-branding");

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return { ...DEFAULT_PUBLIC_BRANDING };
    }

    const payload = await response.json().catch(() => null);
    const parsed = toPublicSiteBranding(payload);

    return {
      siteLogoUrl: parsed.siteLogoUrl ?? DEFAULT_PUBLIC_BRANDING.siteLogoUrl,
      siteLogoDarkUrl: parsed.siteLogoDarkUrl ?? DEFAULT_PUBLIC_BRANDING.siteLogoDarkUrl,
      isMakeupModuleEnabled: parsed.isMakeupModuleEnabled,
    };
  } catch {
    return { ...DEFAULT_PUBLIC_BRANDING };
  }
}
