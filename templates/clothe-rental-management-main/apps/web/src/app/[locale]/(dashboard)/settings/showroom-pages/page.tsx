import { SettingsShowroomPagesPage } from "@/features/settings/components/SettingsShowroomPagesPage";
import { resolveAppLocale } from "@/utils/locale";

interface SettingsShowroomPagesRoutePageProps {
  params: Promise<{ locale: string }>;
}

export default async function SettingsShowroomPagesRoutePage({
  params,
}: SettingsShowroomPagesRoutePageProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);

  return <SettingsShowroomPagesPage locale={currentLocale} />;
}
