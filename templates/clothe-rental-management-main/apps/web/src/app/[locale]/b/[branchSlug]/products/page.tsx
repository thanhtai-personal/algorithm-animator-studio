import { notFound, redirect } from "next/navigation";
import { ProductLandingPage } from "@/features/product-landing/components/ProductLandingPage";
import { buildBranchProductPath } from "@/features/showroom/utils/paths";
import { getPublicBranchContextBySlug, fetchPublicShowroomConfig } from "@/server/services/showroomPublicService";
import { localizePathname, resolveAppLocale } from "@/utils/locale";

export const dynamic = "force-dynamic";

interface BranchProductLandingRouteProps {
  params: Promise<{ locale: string; branchSlug: string }>;
}

export default async function BranchProductLandingRoute({
  params,
}: BranchProductLandingRouteProps) {
  const { locale, branchSlug } = await params;
  const currentLocale = resolveAppLocale(locale);
  const branchContext = await getPublicBranchContextBySlug(branchSlug);

  if (!branchContext?.branchId) {
    notFound();
  }

  const canonicalPath = buildBranchProductPath(
    currentLocale,
    branchContext.branchSlug,
    branchContext.shopDomain
  );
  const requestedPath = localizePathname(`/b/${branchSlug}/products`, currentLocale);
  if (canonicalPath !== requestedPath) {
    redirect(canonicalPath);
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

  return (
    <ProductLandingPage
      locale={currentLocale}
      branchSlug={branchContext.branchSlug}
      initialConfig={initialConfig}
    />
  );
}
