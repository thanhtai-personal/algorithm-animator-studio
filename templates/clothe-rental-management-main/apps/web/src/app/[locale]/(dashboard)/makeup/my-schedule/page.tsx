import { MakeupMySchedulePage } from "@/features/makeup/components/MakeupMySchedulePage";
import { resolveAppLocale } from "@/utils/locale";

interface MakeupMyScheduleRoutePageProps {
  params: Promise<{ locale: string }>;
}

export default async function MakeupMyScheduleRoutePage({
  params,
}: MakeupMyScheduleRoutePageProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);

  return <MakeupMySchedulePage locale={currentLocale} />;
}
