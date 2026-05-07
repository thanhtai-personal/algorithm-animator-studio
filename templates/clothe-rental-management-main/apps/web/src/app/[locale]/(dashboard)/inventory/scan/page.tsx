import { InventoryScanPage } from "@/features/inventory/components/InventoryScanPage";
import { resolveAppLocale } from "@/utils/locale";

interface InventoryScanRouteProps {
  params: Promise<{ locale: string }>;
}

export default async function InventoryScanRoute({
  params,
}: InventoryScanRouteProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);

  return <InventoryScanPage locale={currentLocale} />;
}
