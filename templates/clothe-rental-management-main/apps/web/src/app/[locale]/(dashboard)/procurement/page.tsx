import { ProcurementPage } from "@/features/procurement/components/ProcurementPage";
import { resolveAppLocale } from "@/utils/locale";

interface ProcurementRoutePageProps {
  params: Promise<{ locale: string }>;
}

export default async function ProcurementRoutePage({ params }: ProcurementRoutePageProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);

  return <ProcurementPage locale={currentLocale} />;
}
