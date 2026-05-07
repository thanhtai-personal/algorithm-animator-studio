import { SalesStockPage } from "@/features/sales/components/SalesStockPage";
import { resolveAppLocale } from "@/utils/locale";

interface SalesStockRouteProps {
  params: Promise<{ locale: string }>;
}

export default async function SalesStockRoute({ params }: SalesStockRouteProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);
  return <SalesStockPage locale={currentLocale} />;
}
