import { MakeupMyStatsPage } from "@/features/makeup/components/MakeupMyStatsPage";
import { resolveAppLocale } from "@/utils/locale";

interface MakeupMyStatsRoutePageProps {
  params: Promise<{ locale: string }>;
}

export default async function MakeupMyStatsRoutePage({
  params,
}: MakeupMyStatsRoutePageProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);

  return <MakeupMyStatsPage locale={currentLocale} />;
}
