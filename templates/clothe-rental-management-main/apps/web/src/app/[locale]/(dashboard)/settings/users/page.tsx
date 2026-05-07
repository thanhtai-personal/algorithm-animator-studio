import { SettingsUsersPage } from "@/features/settings/components/SettingsUsersPage";
import { resolveAppLocale } from "@/utils/locale";

interface SettingsUsersRoutePageProps {
  params: Promise<{ locale: string }>;
}

export default async function SettingsUsersRoutePage({
  params,
}: SettingsUsersRoutePageProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);

  return <SettingsUsersPage locale={currentLocale} />;
}
