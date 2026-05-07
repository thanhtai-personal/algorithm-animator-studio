import { ShowroomShortlistPage } from "@/features/showroom/components/ShowroomShortlistPage";
import { fetchPublicShowroomConfig } from "@/server/services/showroomPublicService";
import { resolveAppLocale } from "@/utils/locale";

interface ShowroomShortlistRouteProps {
  params: Promise<{ locale: string }>;
}

const SHOWROOM_CONFIG_PREFETCH_TIMEOUT_MS = 300;

function timeoutNull(delayMs: number): Promise<null> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(null), delayMs);
  });
}

export default async function ShowroomShortlistRoute({
  params,
}: ShowroomShortlistRouteProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);
  const initialConfig = await Promise.race([
    fetchPublicShowroomConfig({ locale: currentLocale }),
    timeoutNull(SHOWROOM_CONFIG_PREFETCH_TIMEOUT_MS),
  ]);

  return <ShowroomShortlistPage locale={currentLocale} initialConfig={initialConfig} />;
}
