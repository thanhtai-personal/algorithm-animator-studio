import { notFound, redirect } from "next/navigation";
import { ShowroomShortlistPage } from "@/features/showroom/components/ShowroomShortlistPage";
import { buildShowroomShortlistPath } from "@/features/showroom/utils/paths";
import {
  fetchPublicShowroomConfig,
  getPublicBranchContextBySlug,
} from "@/server/services/showroomPublicService";
import { localizePathname, resolveAppLocale } from "@/utils/locale";

interface BranchShowroomShortlistRouteProps {
  params: Promise<{ locale: string; branchSlug: string }>;
}

const SHOWROOM_CONFIG_PREFETCH_TIMEOUT_MS = 300;

function timeoutNull(delayMs: number): Promise<null> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(null), delayMs);
  });
}

export default async function BranchShowroomShortlistRoute({
  params,
}: BranchShowroomShortlistRouteProps) {
  const { locale, branchSlug } = await params;
  const currentLocale = resolveAppLocale(locale);
  const initialConfigPromise = fetchPublicShowroomConfig({
    branchSlug,
    locale: currentLocale,
  });
  const branchContext = await getPublicBranchContextBySlug(branchSlug);

  if (!branchContext?.branchId) {
    notFound();
  }

  const canonicalPath = buildShowroomShortlistPath(
    currentLocale,
    branchContext.showroomSlug,
    branchContext.branchSlug,
    branchContext.shopDomain
  );
  const requestedPath = localizePathname(`/b/${branchSlug}/showroom/shortlist`, currentLocale);
  if (canonicalPath !== requestedPath) {
    redirect(canonicalPath);
  }

  const initialConfig = await Promise.race([
    initialConfigPromise,
    timeoutNull(SHOWROOM_CONFIG_PREFETCH_TIMEOUT_MS),
  ]);

  return (
    <ShowroomShortlistPage
      locale={currentLocale}
      branchSlug={branchContext.branchSlug}
      initialConfig={initialConfig}
    />
  );
}
