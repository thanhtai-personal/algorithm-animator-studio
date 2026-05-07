import { MakeupInventoryPage } from "@/features/makeup/components/MakeupInventoryPage";
import { resolveAppLocale } from "@/utils/locale";

interface MakeupInventoryRoutePageProps {
  params: Promise<{ locale: string }>;
}

export default async function MakeupInventoryRoutePage({
  params,
}: MakeupInventoryRoutePageProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);

  return <MakeupInventoryPage locale={currentLocale} />;
}
