import { InventoryDetailPage } from "@/features/inventory/components/InventoryDetailPage";
import { resolveAppLocale } from "@/utils/locale";

interface InventoryItemDetailRouteProps {
  params: Promise<{ locale: string; itemId: string }>;
}

export default async function InventoryItemDetailRoute({
  params,
}: InventoryItemDetailRouteProps) {
  const { locale, itemId } = await params;
  const currentLocale = resolveAppLocale(locale);

  return <InventoryDetailPage locale={currentLocale} itemId={itemId} />;
}
