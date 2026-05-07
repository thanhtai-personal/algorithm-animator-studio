import { SettingsCategoriesPage } from "@/features/settings/components/SettingsCategoriesPage";
import { resolveAppLocale } from "@/utils/locale";

interface ProductCategoriesRoutePageProps {
  params: Promise<{ locale: string }>;
}

export default async function ProductCategoriesRoutePage({
  params,
}: ProductCategoriesRoutePageProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);

  return <SettingsCategoriesPage locale={currentLocale} />;
}
