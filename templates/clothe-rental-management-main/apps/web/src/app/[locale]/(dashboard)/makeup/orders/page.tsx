import { MakeupOrdersPage } from "@/features/makeup/components/MakeupOrdersPage";
import { resolveAppLocale } from "@/utils/locale";

interface MakeupOrdersRoutePageProps {
  params: Promise<{ locale: string }>;
}

export default async function MakeupOrdersRoutePage({
  params,
}: MakeupOrdersRoutePageProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);

  return <MakeupOrdersPage locale={currentLocale} />;
}
