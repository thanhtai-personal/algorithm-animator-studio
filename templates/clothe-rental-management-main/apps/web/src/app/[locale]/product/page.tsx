import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { VietnamStoreMapHomepage } from "@/features/product-landing/components/VietnamStoreMapHomepage";
import { parseGlobalHomepageMapMarkers } from "@/features/product-landing/utils/globalHomepageMapConfig";
import { buildBranchProductPath } from "@/features/showroom/utils/paths";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveShopDomainFromHost } from "@/server/services/publicBranchHostService";
import {
  fetchPublicBranchMap,
  fetchPublicShowroomConfig,
  getPublicBranchContextByBranchId,
  getPublicBranchContextByShopDomain,
} from "@/server/services/showroomPublicService";
import type { PublicShowroomPageConfigDto } from "@/types/settingsModule";
import { resolveAppLocale } from "@/utils/locale";

interface ProductLandingRouteProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ branchId?: string }>;
}

type ProfileSummaryRow = {
  full_name: string | null;
  role: string | null;
};

interface CurrentUserHeaderState {
  displayName: string | null;
  role: string | null;
}

function parseRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveHomepageMapContent(config: PublicShowroomPageConfigDto | null) {
  if (!config) return null;
  const heroConfig = parseRecord(config.heroConfigJson);
  const seoConfig = parseRecord(config.seoConfigJson);
  const markers = parseGlobalHomepageMapMarkers(config.themeConfigJson);

  return {
    brandName: readString(heroConfig.pageName) ?? readString(config.title),
    badge: readString(heroConfig.badge),
    title: readString(heroConfig.heading) ?? readString(config.title),
    subtitle: readString(heroConfig.subheading) ?? readString(config.subtitle),
    description: readString(seoConfig.description),
    markers,
  };
}

async function resolveCurrentUserHeaderState(): Promise<CurrentUserHeaderState | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .maybeSingle<ProfileSummaryRow>();

    const normalizedRole =
      typeof profile?.role === "string"
        ? profile.role.trim().toLowerCase()
        : typeof user.app_metadata?.role === "string"
          ? user.app_metadata.role.trim().toLowerCase()
          : null;

    const profileName = profile?.full_name?.trim() ?? "";
    if (profileName) {
      return {
        displayName: profileName,
        role: normalizedRole,
      };
    }

    const metadataName =
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name.trim()
        : typeof user.user_metadata?.name === "string"
          ? user.user_metadata.name.trim()
          : "";
    if (metadataName) {
      return {
        displayName: metadataName,
        role: normalizedRole,
      };
    }

    const email = user.email?.trim() ?? "";
    if (email) {
      return {
        displayName: email,
        role: normalizedRole,
      };
    }

    return {
      displayName: null,
      role: normalizedRole,
    };
  } catch {
    return null;
  }
}

export default async function ProductLandingRoute({
  params,
  searchParams,
}: ProductLandingRouteProps) {
  const { locale } = await params;
  const query = await searchParams;
  const currentLocale = resolveAppLocale(locale);
  const requestedBranchId =
    typeof query.branchId === "string" ? query.branchId.trim() : "";
  const headerStore = await headers();
  const requestHost =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const shopDomain = resolveShopDomainFromHost(requestHost);

  if (requestedBranchId) {
    const branchContext = await getPublicBranchContextByBranchId(requestedBranchId);
    if (branchContext?.branchSlug) {
      const targetPath = buildBranchProductPath(
        currentLocale,
        branchContext.branchSlug,
        branchContext.shopDomain
      );
      redirect(targetPath);
    }
  }

  if (shopDomain) {
    const branchContext = await getPublicBranchContextByShopDomain(shopDomain);
    if (branchContext?.branchSlug) {
      const targetPath = buildBranchProductPath(
        currentLocale,
        branchContext.branchSlug,
        branchContext.shopDomain
      );
      redirect(targetPath);
    }
  }

  const [branchMapItems, currentUserState, globalHomepageConfig] = await Promise.all([
    fetchPublicBranchMap({ revalidate: 300 }),
    resolveCurrentUserHeaderState(),
    fetchPublicShowroomConfig(
      {
        locale: currentLocale,
        scope: "global",
      }
    ),
  ]);
  const mapHomepageContent = resolveHomepageMapContent(globalHomepageConfig);

  return (
    <VietnamStoreMapHomepage
      locale={currentLocale}
      branches={branchMapItems}
      currentUserDisplayName={currentUserState?.displayName ?? null}
      currentUserRole={currentUserState?.role ?? null}
      content={mapHomepageContent}
    />
  );
}
