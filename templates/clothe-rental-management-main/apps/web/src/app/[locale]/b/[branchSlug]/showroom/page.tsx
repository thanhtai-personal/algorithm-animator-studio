import { notFound, redirect } from "next/navigation";
import { ShowroomListPage } from "@/features/showroom/components/ShowroomListPage";
import { buildShowroomBasePath } from "@/features/showroom/utils/paths";
import {
  fetchPublicShowroomConfig,
  getPublicBranchContextBySlug,
} from "@/server/services/showroomPublicService";
import { localizePathname, resolveAppLocale } from "@/utils/locale";

interface BranchShowroomPageProps {
  params: Promise<{ locale: string; branchSlug: string }>;
  searchParams: Promise<{ q?: string }>;
}

const SHOWROOM_CONFIG_PREFETCH_TIMEOUT_MS = 300;

function timeoutNull(delayMs: number): Promise<null> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(null), delayMs);
  });
}

export default async function BranchShowroomPage({
  params,
  searchParams,
}: BranchShowroomPageProps) {
  const { locale, branchSlug } = await params;
  const query = await searchParams;
  const currentLocale = resolveAppLocale(locale);
  const initialSearch = typeof query.q === "string" ? query.q : "";
  const initialConfigPromise = fetchPublicShowroomConfig({
    branchSlug,
    locale: currentLocale,
  });
  const branchContext = await getPublicBranchContextBySlug(branchSlug);

  if (!branchContext?.branchId) {
    notFound();
  }

  const basePath = buildShowroomBasePath(
    currentLocale,
    branchContext.showroomSlug,
    branchContext.branchSlug,
    branchContext.shopDomain
  );
  const requestedPath = localizePathname(`/b/${branchSlug}/showroom`, currentLocale);
  if (basePath !== requestedPath) {
    const href = initialSearch ? `${basePath}?q=${encodeURIComponent(initialSearch)}` : basePath;
    redirect(href);
  }

  const initialConfig = await Promise.race([
    initialConfigPromise,
    timeoutNull(SHOWROOM_CONFIG_PREFETCH_TIMEOUT_MS),
  ]);

  return (
    <ShowroomListPage
      key={`${currentLocale}:${branchContext.branchSlug}:${initialSearch}`}
      locale={currentLocale}
      initialSearch={initialSearch}
      branchSlug={branchContext.branchSlug}
      initialConfig={initialConfig}
    />
  );
}
