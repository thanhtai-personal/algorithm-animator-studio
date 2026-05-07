import { notFound, redirect } from "next/navigation";
import { buildShowroomBasePath } from "@/features/showroom/utils/paths";
import { getPublicBranchContextByShopDomainOrSlug } from "@/server/services/showroomPublicService";
import { resolveAppLocale } from "@/utils/locale";

interface ShopDomainSearchPageProps {
  params: Promise<{ locale: string; shopDomain: string }>;
  searchParams: Promise<{ q?: string }>;
}

export default async function ShopDomainSearchPage({
  params,
  searchParams,
}: ShopDomainSearchPageProps) {
  const { locale, shopDomain } = await params;
  const query = await searchParams;
  const q = typeof query.q === "string" ? query.q.trim() : "";
  const currentLocale = resolveAppLocale(locale);
  const branchContext = await getPublicBranchContextByShopDomainOrSlug(shopDomain);

  if (!branchContext?.branchId) {
    notFound();
  }

  const basePath = buildShowroomBasePath(
    currentLocale,
    branchContext.showroomSlug,
    branchContext.branchSlug,
    branchContext.shopDomain
  );
  const href = q ? `${basePath}?q=${encodeURIComponent(q)}` : basePath;
  redirect(href);
}
