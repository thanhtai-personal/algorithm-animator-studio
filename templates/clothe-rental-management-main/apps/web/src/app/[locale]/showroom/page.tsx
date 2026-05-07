import { ShowroomListPage } from "@/features/showroom/components/ShowroomListPage";
import { fetchPublicShowroomConfig } from "@/server/services/showroomPublicService";
import { resolveAppLocale } from "@/utils/locale";

interface ShowroomPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}

const SHOWROOM_CONFIG_PREFETCH_TIMEOUT_MS = 300;

function timeoutNull(delayMs: number): Promise<null> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(null), delayMs);
  });
}

export default async function ShowroomPage({ params, searchParams }: ShowroomPageProps) {
  const { locale } = await params;
  const query = await searchParams;
  const currentLocale = resolveAppLocale(locale);
  const initialSearch = typeof query.q === "string" ? query.q : "";
  const initialConfig = await Promise.race([
    fetchPublicShowroomConfig({ locale: currentLocale }),
    timeoutNull(SHOWROOM_CONFIG_PREFETCH_TIMEOUT_MS),
  ]);

  return (
    <ShowroomListPage
      key={`${currentLocale}:${initialSearch}`}
      locale={currentLocale}
      initialSearch={initialSearch}
      initialConfig={initialConfig}
    />
  );
}
