import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ShowroomListPage } from "@/features/showroom/components/ShowroomListPage";
import { buildShowroomBasePath } from "@/features/showroom/utils/paths";
import {
  fetchPublicShowroomConfig,
  getPublicBranchContextByShopDomainOrSlug,
} from "@/server/services/showroomPublicService";
import { localizePathname, resolveAppLocale } from "@/utils/locale";
import { buildLocalizedAlternates } from "@/utils/seoAlternates";

interface ShopDomainShowroomPageProps {
  params: Promise<{ locale: string; shopDomain: string }>;
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({
  params,
}: Pick<ShopDomainShowroomPageProps, "params">): Promise<Metadata> {
  const { locale, shopDomain } = await params;
  const currentLocale = resolveAppLocale(locale);
  const branchContext = await getPublicBranchContextByShopDomainOrSlug(shopDomain);

  if (!branchContext?.branchId) {
    return {};
  }

  const canonicalPath = buildShowroomBasePath(
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

export default async function ShopDomainShowroomPage({
  params,
  searchParams,
}: ShopDomainShowroomPageProps) {
  const { locale, shopDomain } = await params;
  const query = await searchParams;
  const currentLocale = resolveAppLocale(locale);
  const initialSearch = typeof query.q === "string" ? query.q : "";
  const initialConfigPromise = fetchPublicShowroomConfig({
    shopDomain,
    locale: currentLocale,
  });
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
  const requestedPath = localizePathname(`/${shopDomain}/showroom`, currentLocale);
  if (basePath !== requestedPath) {
    const href = initialSearch ? `${basePath}?q=${encodeURIComponent(initialSearch)}` : basePath;
    redirect(href);
  }

  const initialConfig = await Promise.race([
    initialConfigPromise,
    timeoutNull(SHOWROOM_CONFIG_PREFETCH_TIMEOUT_MS),
  ]);

  const branchIdentity = branchContext.shopDomain ?? branchContext.branchSlug;
  if (branchContext.shopDomain) {
    return (
      <ShowroomListPage
        key={`${currentLocale}:${branchIdentity}:${initialSearch}`}
        locale={currentLocale}
        initialSearch={initialSearch}
        shopDomain={branchContext.shopDomain}
        initialConfig={initialConfig}
      />
    );
  }

  return (
    <ShowroomListPage
      key={`${currentLocale}:${branchIdentity}:${initialSearch}`}
      locale={currentLocale}
      initialSearch={initialSearch}
      branchSlug={branchContext.branchSlug}
      initialConfig={initialConfig}
    />
  );
}
