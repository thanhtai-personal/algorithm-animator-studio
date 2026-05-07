import { headers } from "next/headers";
import { SalesPosPage } from "@/features/sales/components/SalesPosPage";
import { resolveShopDomainFromHost } from "@/server/services/publicBranchHostService";
import {
  getPublicBranchContextByBranchId,
  getPublicBranchContextByShopDomain,
  getPublicBranchContextBySlug,
} from "@/server/services/showroomPublicService";
import { resolveAppLocale } from "@/utils/locale";

interface SalesPosRouteProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ branchSlug?: string; branchId?: string }>;
}

export default async function SalesPosRoute({
  params,
  searchParams,
}: SalesPosRouteProps) {
  const { locale } = await params;
  const query = await searchParams;
  const currentLocale = resolveAppLocale(locale);
  const requestedBranchSlug =
    typeof query.branchSlug === "string" ? query.branchSlug.trim() : "";
  const requestedBranchId =
    typeof query.branchId === "string" ? query.branchId.trim() : "";
  const headerStore = await headers();
  const requestHost =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const resolvedShopDomain = resolveShopDomainFromHost(requestHost);

  const forcedBranch =
    (requestedBranchSlug
      ? await getPublicBranchContextBySlug(requestedBranchSlug)
      : null) ??
    (requestedBranchId
      ? await getPublicBranchContextByBranchId(requestedBranchId)
      : null) ??
    (resolvedShopDomain
      ? await getPublicBranchContextByShopDomain(resolvedShopDomain)
      : null);

  return (
    <SalesPosPage
      locale={currentLocale}
      forcedBranch={
        forcedBranch
          ? {
              branchId: forcedBranch.branchId,
              branchCode: forcedBranch.branchCode,
              branchName: forcedBranch.branchName,
              branchSlug: forcedBranch.branchSlug,
            }
          : null
      }
    />
  );
}
