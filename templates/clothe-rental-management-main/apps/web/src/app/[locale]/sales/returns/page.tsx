import { SalesReturnsPage } from "@/features/sales/components/SalesReturnsPage";
import { resolveAppLocale } from "@/utils/locale";

interface SalesReturnsRouteProps {
  params: Promise<{ locale: string }>;
}

export default async function SalesReturnsRoute({ params }: SalesReturnsRouteProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);
  return <SalesReturnsPage locale={currentLocale} />;
}
