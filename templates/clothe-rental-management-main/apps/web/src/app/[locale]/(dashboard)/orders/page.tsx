import { OrdersListPage } from "@/features/orders/components/OrdersListPage";
import { resolveAppLocale } from "@/utils/locale";

interface OrdersRoutePageProps {
  params: Promise<{ locale: string }>;
}

export default async function OrdersRoutePage({ params }: OrdersRoutePageProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);

  return <OrdersListPage locale={currentLocale} />;
}
