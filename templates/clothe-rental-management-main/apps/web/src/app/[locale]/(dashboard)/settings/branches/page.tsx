import { SettingsBranchesPage } from "@/features/settings/components/SettingsBranchesPage";
import { resolveAppLocale } from "@/utils/locale";

interface SettingsBranchesRoutePageProps {
  params: Promise<{ locale: string }>;
}

export default async function SettingsBranchesRoutePage({
  params,
}: SettingsBranchesRoutePageProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);

  return <SettingsBranchesPage locale={currentLocale} />;
}
