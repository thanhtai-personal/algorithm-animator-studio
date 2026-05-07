import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProductLandingPage } from "@/features/product-landing/components/ProductLandingPage";
import { buildBranchProductPath } from "@/features/showroom/utils/paths";
import {
  getPublicBranchContextByShopDomainOrSlug,
  fetchPublicShowroomConfig,
} from "@/server/services/showroomPublicService";
import { localizePathname, resolveAppLocale } from "@/utils/locale";
import { buildLocalizedAlternates } from "@/utils/seoAlternates";

export const dynamic = "force-dynamic";

interface ShopDomainProductLandingIndexRouteProps {
  params: Promise<{ locale: string; shopDomain: string }>;
}

async function resolveShopDomainCanonicalPath(
  locale: string,
  shopDomain: string
): Promise<string | null> {
  const currentLocale = resolveAppLocale(locale);
  const branchContext = await getPublicBranchContextByShopDomainOrSlug(shopDomain);

  if (!branchContext?.branchId) {
    return null;
  }

  const canonicalPath = buildBranchProductPath(
    currentLocale,
    branchContext.branchSlug,
    branchContext.shopDomain
  );
  const globalProductPath = localizePathname("/product", currentLocale);
  const branchFallbackPath = localizePathname(
    `/b/${branchContext.branchSlug}/products`,
    currentLocale
  );

  return canonicalPath === globalProductPath ? branchFallbackPath : canonicalPath;
}

export async function generateMetadata({
  params,
}: ShopDomainProductLandingIndexRouteProps): Promise<Metadata> {
  const { locale, shopDomain } = await params;
  const currentLocale = resolveAppLocale(locale);
  const canonicalPath = await resolveShopDomainCanonicalPath(locale, shopDomain);

  if (!canonicalPath) {
    return {};
  }

  return {
    alternates: buildLocalizedAlternates(canonicalPath, currentLocale),
  };
}

export default async function ShopDomainProductLandingIndexRoute({
  params,
}: ShopDomainProductLandingIndexRouteProps) {
  const { locale, shopDomain } = await params;
  const currentLocale = resolveAppLocale(locale);
  const branchContext = await getPublicBranchContextByShopDomainOrSlug(shopDomain);

  if (!branchContext?.branchId) {
    notFound();
  }

  const safeCanonicalPath = await resolveShopDomainCanonicalPath(locale, shopDomain);
  const requestedPath = localizePathname(`/${shopDomain}`, currentLocale);
  if (safeCanonicalPath && safeCanonicalPath !== requestedPath) {
    redirect(safeCanonicalPath);
  }

  const initialConfig = await fetchPublicShowroomConfig(
    {
      showroomSlug: branchContext.showroomSlug ?? null,
      branchId: branchContext.branchId ?? null,
      branchSlug: branchContext.branchSlug ?? null,
      shopDomain: branchContext.shopDomain ?? null,
      locale: currentLocale,
    }
  );

  if (branchContext.shopDomain) {
    return (
      <ProductLandingPage
        locale={currentLocale}
        shopDomain={branchContext.shopDomain}
        initialConfig={initialConfig}
      />
    );
  }

  return (
    <ProductLandingPage
      locale={currentLocale}
      branchSlug={branchContext.branchSlug}
      initialConfig={initialConfig}
    />
  );
}
