import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ShowroomProductDetailPage } from "@/features/showroom/components/ShowroomProductDetailPage";
import { buildShowroomDetailPath } from "@/features/showroom/utils/paths";
import { getPublicBranchContextByShopDomainOrSlug } from "@/server/services/showroomPublicService";
import { localizePathname, resolveAppLocale } from "@/utils/locale";
import { buildLocalizedAlternates } from "@/utils/seoAlternates";

interface ShopDomainShowroomProductDetailRouteProps {
  params: Promise<{ locale: string; shopDomain: string; productId: string }>;
}

export async function generateMetadata({
  params,
}: ShopDomainShowroomProductDetailRouteProps): Promise<Metadata> {
  const { locale, shopDomain, productId } = await params;
  const currentLocale = resolveAppLocale(locale);
  const branchContext = await getPublicBranchContextByShopDomainOrSlug(shopDomain);

  if (!branchContext?.branchId) {
    return {};
  }

  const canonicalPath = buildShowroomDetailPath(
    currentLocale,
    productId,
    branchContext.showroomSlug,
    branchContext.branchSlug,
    branchContext.shopDomain
  );

  return {
    alternates: buildLocalizedAlternates(canonicalPath, currentLocale),
  };
}

export default async function ShopDomainShowroomProductDetailRoute({
  params,
}: ShopDomainShowroomProductDetailRouteProps) {
  const { locale, shopDomain, productId } = await params;
  const currentLocale = resolveAppLocale(locale);
  const branchContext = await getPublicBranchContextByShopDomainOrSlug(shopDomain);

  if (!branchContext?.branchId) {
    notFound();
  }

  const canonicalPath = buildShowroomDetailPath(
    currentLocale,
    productId,
    branchContext.showroomSlug,
    branchContext.branchSlug,
    branchContext.shopDomain
  );
  const requestedPath = localizePathname(`/${shopDomain}/showroom/p/${productId}`, currentLocale);
  if (canonicalPath !== requestedPath) {
    redirect(canonicalPath);
  }

  if (branchContext.shopDomain) {
    return (
      <ShowroomProductDetailPage
        locale={currentLocale}
        productId={productId}
        shopDomain={branchContext.shopDomain}
      />
    );
  }

  return (
    <ShowroomProductDetailPage
      locale={currentLocale}
      productId={productId}
      branchSlug={branchContext.branchSlug}
    />
  );
}
