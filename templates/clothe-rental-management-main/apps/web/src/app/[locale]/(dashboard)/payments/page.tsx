import { PaymentsListPage } from "@/features/payments/components/PaymentsListPage";
import { resolveAppLocale } from "@/utils/locale";

interface PaymentsRoutePageProps {
  params: Promise<{ locale: string }>;
}

export default async function PaymentsRoutePage({ params }: PaymentsRoutePageProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);

  return <PaymentsListPage locale={currentLocale} />;
}
