import { MakeupCalendarPage } from "@/features/makeup/components/MakeupCalendarPage";
import { resolveAppLocale } from "@/utils/locale";

interface MakeupCalendarRoutePageProps {
  params: Promise<{ locale: string }>;
}

export default async function MakeupCalendarRoutePage({
  params,
}: MakeupCalendarRoutePageProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);

  return <MakeupCalendarPage locale={currentLocale} />;
}
