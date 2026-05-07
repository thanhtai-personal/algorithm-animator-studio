import { CalendarPage } from "@/features/calendar/components/CalendarPage";
import { resolveAppLocale } from "@/utils/locale";

interface CalendarRoutePageProps {
  params: Promise<{ locale: string }>;
}

export default async function CalendarRoutePage({ params }: CalendarRoutePageProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);

  return <CalendarPage locale={currentLocale} />;
}
