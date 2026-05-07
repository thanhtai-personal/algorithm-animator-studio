import { notFound, redirect } from "next/navigation";
import { buildBranchProductPath } from "@/features/showroom/utils/paths";
import { getPublicBranchContextByShopDomainOrSlug } from "@/server/services/showroomPublicService";
import { localizePathname, resolveAppLocale } from "@/utils/locale";

export const dynamic = "force-dynamic";

interface ShopDomainProductLandingRouteProps {
  params: Promise<{ locale: string; shopDomain: string }>;
}

export default async function ShopDomainProductLandingAliasRoute({
  params,
}: ShopDomainProductLandingRouteProps) {
  const { locale, shopDomain } = await params;
  const currentLocale = resolveAppLocale(locale);
  const branchContext = await getPublicBranchContextByShopDomainOrSlug(shopDomain);

  if (!branchContext?.branchId) {
    notFound();
  }

  const canonicalPath = buildBranchProductPath(
    currentLocale,
    branchContext.branchSlug,
    branchContext.shopDomain
  );
  const safeCanonicalPath =
    canonicalPath === localizePathname("/product", currentLocale)
      ? localizePathname(`/b/${branchContext.branchSlug}/products`, currentLocale)
      : canonicalPath;

  redirect(safeCanonicalPath);
}
