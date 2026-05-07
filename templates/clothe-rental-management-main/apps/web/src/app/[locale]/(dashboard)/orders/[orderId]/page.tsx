import { OrderDetailPage } from "@/features/orders/components/OrderDetailPage";
import { resolveAppLocale } from "@/utils/locale";

interface OrderDetailRoutePageProps {
  params: Promise<{ locale: string; orderId: string }>;
}

export default async function OrderDetailRoutePage({
  params,
}: OrderDetailRoutePageProps) {
  const { locale, orderId } = await params;
  const currentLocale = resolveAppLocale(locale);

  return <OrderDetailPage locale={currentLocale} orderId={orderId} />;
}
