import { OrderWizardPage } from "@/features/orders/components/OrderWizardPage";
import { resolveAppLocale } from "@/utils/locale";

interface EditOrderRoutePageProps {
  params: Promise<{ locale: string; orderId: string }>;
}

export default async function EditOrderRoutePage({
  params,
}: EditOrderRoutePageProps) {
  const { locale, orderId } = await params;
  const currentLocale = resolveAppLocale(locale);

  return <OrderWizardPage locale={currentLocale} mode="edit" orderId={orderId} />;
}
