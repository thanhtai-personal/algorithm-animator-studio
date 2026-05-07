import { OrderWizardPage } from "@/features/orders/components/OrderWizardPage";
import { resolveAppLocale } from "@/utils/locale";

interface NewOrderRoutePageProps {
  params: Promise<{ locale: string }>;
}

export default async function NewOrderRoutePage({ params }: NewOrderRoutePageProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);

  return <OrderWizardPage locale={currentLocale} mode="create" />;
}
