import { MakeupPackagesPage } from "@/features/makeup/components/MakeupPackagesPage";
import { resolveAppLocale } from "@/utils/locale";

interface MakeupPackagesRoutePageProps {
  params: Promise<{ locale: string }>;
}

export default async function MakeupPackagesRoutePage({
  params,
}: MakeupPackagesRoutePageProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);

  return <MakeupPackagesPage locale={currentLocale} />;
}
