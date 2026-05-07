import { redirect } from "next/navigation";
import { resolveAppLocale } from "@/utils/locale";

interface SettingsCategoriesRoutePageProps {
  params: Promise<{ locale: string }>;
}

export default async function SettingsCategoriesRoutePage({
  params,
}: SettingsCategoriesRoutePageProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);

  redirect(`/${currentLocale}/categories`);
}
