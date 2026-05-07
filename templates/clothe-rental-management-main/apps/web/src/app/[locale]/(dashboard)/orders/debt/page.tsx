import { DebtOrdersPage } from "@/features/orders/components/DebtOrdersPage";
import { resolveAppLocale } from "@/utils/locale";

interface DebtOrdersRoutePageProps {
  params: Promise<{ locale: string }>;
}

export default async function DebtOrdersRoutePage({
  params,
}: DebtOrdersRoutePageProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);

  return <DebtOrdersPage locale={currentLocale} />;
}
