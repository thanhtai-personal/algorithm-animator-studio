import { SettingsGeneralPage } from "@/features/settings/components/SettingsGeneralPage";
import { resolveAppLocale } from "@/utils/locale";

interface SettingsGeneralRoutePageProps {
  params: Promise<{ locale: string }>;
}

export default async function SettingsGeneralRoutePage({
  params,
}: SettingsGeneralRoutePageProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);

  return <SettingsGeneralPage locale={currentLocale} />;
}
