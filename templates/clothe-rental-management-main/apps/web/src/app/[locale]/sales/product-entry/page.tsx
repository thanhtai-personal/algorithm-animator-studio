import { SalesProductEntryPage } from "@/features/sales/components/SalesProductEntryPage";
import { resolveAppLocale } from "@/utils/locale";

interface SalesProductEntryRouteProps {
  params: Promise<{ locale: string }>;
}

export default async function SalesProductEntryRoute({
  params,
}: SalesProductEntryRouteProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);
  return <SalesProductEntryPage locale={currentLocale} />;
}
