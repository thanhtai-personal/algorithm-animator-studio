import { ShowroomShortlistPage } from "@/features/showroom/components/ShowroomShortlistPage";
import { notFound } from "next/navigation";
import {
  assertPublicShowroomSlugExists,
  fetchPublicShowroomConfig,
} from "@/server/services/showroomPublicService";
import { resolveAppLocale } from "@/utils/locale";

interface ShowroomShortlistBySlugRouteProps {
  params: Promise<{ locale: string; showroomSlug: string }>;
}

const SHOWROOM_CONFIG_PREFETCH_TIMEOUT_MS = 300;

function timeoutNull(delayMs: number): Promise<null> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(null), delayMs);
  });
}

export default async function ShowroomShortlistBySlugRoute({
  params,
}: ShowroomShortlistBySlugRouteProps) {
  const { locale, showroomSlug } = await params;
  const currentLocale = resolveAppLocale(locale);
  const initialConfigPromise = fetchPublicShowroomConfig({
    showroomSlug,
    locale: currentLocale,
  });
  const showroomExists = await assertPublicShowroomSlugExists(showroomSlug);

  if (!showroomExists) {
    notFound();
  }

  const initialConfig = await Promise.race([
    initialConfigPromise,
    timeoutNull(SHOWROOM_CONFIG_PREFETCH_TIMEOUT_MS),
  ]);

  return (
    <ShowroomShortlistPage
      locale={currentLocale}
      showroomSlug={showroomSlug}
      initialConfig={initialConfig}
    />
  );
}
