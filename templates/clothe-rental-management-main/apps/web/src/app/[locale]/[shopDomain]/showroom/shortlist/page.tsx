import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ShowroomShortlistPage } from "@/features/showroom/components/ShowroomShortlistPage";
import { buildShowroomShortlistPath } from "@/features/showroom/utils/paths";
import {
  fetchPublicShowroomConfig,
  getPublicBranchContextByShopDomainOrSlug,
} from "@/server/services/showroomPublicService";
import { localizePathname, resolveAppLocale } from "@/utils/locale";
import { buildLocalizedAlternates } from "@/utils/seoAlternates";

interface ShopDomainShowroomShortlistRouteProps {
  params: Promise<{ locale: string; shopDomain: string }>;
}

export async function generateMetadata({
  params,
}: ShopDomainShowroomShortlistRouteProps): Promise<Metadata> {
  const { locale, shopDomain } = await params;
  const currentLocale = resolveAppLocale(locale);
  const branchContext = await getPublicBranchContextByShopDomainOrSlug(shopDomain);

  if (!branchContext?.branchId) {
    return {};
  }

  const canonicalPath = buildShowroomShortlistPath(
    currentLocale,
    branchContext.showroomSlug,
    branchContext.branchSlug,
    branchContext.shopDomain
  );

  return {
    alternates: buildLocalizedAlternates(canonicalPath, currentLocale),
  };
}

const SHOWROOM_CONFIG_PREFETCH_TIMEOUT_MS = 300;

function timeoutNull(delayMs: number): Promise<null> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(null), delayMs);
  });
}

export default async function ShopDomainShowroomShortlistRoute({
  params,
}: ShopDomainShowroomShortlistRouteProps) {
  const { locale, shopDomain } = await params;
  const currentLocale = resolveAppLocale(locale);
  const initialConfigPromise = fetchPublicShowroomConfig({
    shopDomain,
    locale: currentLocale,
  });
  const branchContext = await getPublicBranchContextByShopDomainOrSlug(shopDomain);

  if (!branchContext?.branchId) {
    notFound();
  }

  const canonicalPath = buildShowroomShortlistPath(
    currentLocale,
    branchContext.showroomSlug,
    branchContext.branchSlug,
    branchContext.shopDomain
  );
  const requestedPath = localizePathname(`/${shopDomain}/showroom/shortlist`, currentLocale);
  if (canonicalPath !== requestedPath) {
    redirect(canonicalPath);
  }

  const initialConfig = await Promise.race([
    initialConfigPromise,
    timeoutNull(SHOWROOM_CONFIG_PREFETCH_TIMEOUT_MS),
  ]);

  if (branchContext.shopDomain) {
    return (
      <ShowroomShortlistPage
        locale={currentLocale}
        shopDomain={branchContext.shopDomain}
        initialConfig={initialConfig}
      />
    );
  }

  return (
    <ShowroomShortlistPage
      locale={currentLocale}
      branchSlug={branchContext.branchSlug}
      initialConfig={initialConfig}
    />
  );
}
