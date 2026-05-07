import { SalesSurchargeExpensePage } from "@/features/sales/components/SalesSurchargeExpensePage";
import { resolveAppLocale } from "@/utils/locale";

interface SalesSurchargeExpenseRouteProps {
  params: Promise<{ locale: string }>;
}

export default async function SalesSurchargeExpenseRoute({
  params,
}: SalesSurchargeExpenseRouteProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);

  return <SalesSurchargeExpensePage locale={currentLocale} />;
}
