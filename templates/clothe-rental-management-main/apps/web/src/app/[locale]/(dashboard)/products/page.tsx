import { ProductsListPage } from "@/features/products/components/ProductsListPage";
import { resolveAppLocale } from "@/utils/locale";

interface ProductsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function ProductsPage({ params }: ProductsPageProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);

  return <ProductsListPage locale={currentLocale} />;
}
