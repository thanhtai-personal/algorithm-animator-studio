import { SalesInvoicesPage } from "@/features/sales/components/SalesInvoicesPage";
import { resolveAppLocale } from "@/utils/locale";

interface SalesInvoicesRouteProps {
  params: Promise<{ locale: string }>;
}

export default async function SalesInvoicesRoute({ params }: SalesInvoicesRouteProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);
  return <SalesInvoicesPage locale={currentLocale} />;
}
