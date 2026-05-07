import { redirect } from "next/navigation";
import { resolveAppLocale } from "@/utils/locale";

interface SettingsRoutePageProps {
  params: Promise<{ locale: string }>;
}

export default async function SettingsRoutePage({ params }: SettingsRoutePageProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);

  redirect(`/${currentLocale}/settings/general`);
}
