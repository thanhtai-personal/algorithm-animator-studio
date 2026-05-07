import { MakeupAdminOverviewPage } from "@/features/makeup/components/MakeupAdminOverviewPage";
import { resolveAppLocale } from "@/utils/locale";

interface MakeupAdminOverviewRoutePageProps {
  params: Promise<{ locale: string }>;
}

export default async function MakeupAdminOverviewRoutePage({
  params,
}: MakeupAdminOverviewRoutePageProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);

  return <MakeupAdminOverviewPage locale={currentLocale} />;
}
