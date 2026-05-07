import { InventoryListPage } from "@/features/inventory/components/InventoryListPage";
import { resolveAppLocale } from "@/utils/locale";

interface InventoryPageProps {
  params: Promise<{ locale: string }>;
}

export default async function InventoryPage({ params }: InventoryPageProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);

  return <InventoryListPage locale={currentLocale} />;
}
