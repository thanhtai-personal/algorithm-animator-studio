import { SettingsShowroomsPage } from "@/features/settings/components/SettingsShowroomsPage";
import { resolveAppLocale } from "@/utils/locale";

interface SettingsShowroomsRoutePageProps {
  params: Promise<{ locale: string }>;
}

export default async function SettingsShowroomsRoutePage({
  params,
}: SettingsShowroomsRoutePageProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);

  return <SettingsShowroomsPage locale={currentLocale} />;
}
