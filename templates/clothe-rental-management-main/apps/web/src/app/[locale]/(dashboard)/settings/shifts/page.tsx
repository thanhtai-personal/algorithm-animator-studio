import { redirect } from "next/navigation";
import { resolveAppLocale } from "@/utils/locale";

interface SettingsShiftsRoutePageProps {
  params: Promise<{ locale: string }>;
}

export default async function SettingsShiftsRoutePage({
  params,
}: SettingsShiftsRoutePageProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);

  redirect(`/${currentLocale}/shifts`);
}
