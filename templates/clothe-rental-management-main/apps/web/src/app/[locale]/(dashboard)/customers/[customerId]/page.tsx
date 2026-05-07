import { CustomerDetailPage } from "@/features/customers/components/CustomerDetailPage";
import { resolveAppLocale } from "@/utils/locale";

interface CustomerDetailRoutePageProps {
  params: Promise<{ locale: string; customerId: string }>;
}

export default async function CustomerDetailRoutePage({
  params,
}: CustomerDetailRoutePageProps) {
  const { locale, customerId } = await params;
  const currentLocale = resolveAppLocale(locale);

  return <CustomerDetailPage locale={currentLocale} customerId={customerId} />;
}
