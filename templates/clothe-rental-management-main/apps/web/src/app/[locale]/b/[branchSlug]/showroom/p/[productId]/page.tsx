import { notFound, redirect } from "next/navigation";
import { ShowroomProductDetailPage } from "@/features/showroom/components/ShowroomProductDetailPage";
import { buildShowroomDetailPath } from "@/features/showroom/utils/paths";
import { getPublicBranchContextBySlug } from "@/server/services/showroomPublicService";
import { localizePathname, resolveAppLocale } from "@/utils/locale";

interface BranchShowroomProductDetailRouteProps {
  params: Promise<{ locale: string; branchSlug: string; productId: string }>;
}

export default async function BranchShowroomProductDetailRoute({
  params,
}: BranchShowroomProductDetailRouteProps) {
  const { locale, branchSlug, productId } = await params;
  const currentLocale = resolveAppLocale(locale);
  const branchContext = await getPublicBranchContextBySlug(branchSlug);

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
  const requestedPath = localizePathname(
    `/b/${branchSlug}/showroom/p/${productId}`,
    currentLocale
  );
  if (canonicalPath !== requestedPath) {
    redirect(canonicalPath);
  }

  return (
    <ShowroomProductDetailPage
      locale={currentLocale}
      productId={productId}
      branchSlug={branchContext.branchSlug}
    />
  );
}
