import { SettingsShiftsPage } from "@/features/settings/components/SettingsShiftsPage";
import { resolveAppLocale } from "@/utils/locale";

interface ShiftsRoutePageProps {
  params: Promise<{ locale: string }>;
}

export default async function ShiftsRoutePage({
  params,
}: ShiftsRoutePageProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);

  return <SettingsShiftsPage locale={currentLocale} />;
}
