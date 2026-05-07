import { ProductDetailPage } from "@/features/products/components/ProductDetailPage";
import { resolveAppLocale } from "@/utils/locale";

interface ProductDetailRoutePageProps {
  params: Promise<{ locale: string; productId: string }>;
}

export default async function ProductDetailRoutePage({
  params,
}: ProductDetailRoutePageProps) {
  const { locale, productId } = await params;
  const currentLocale = resolveAppLocale(locale);

  return <ProductDetailPage locale={currentLocale} productId={productId} />;
}
