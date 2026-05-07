import { ShowroomProductDetailPage } from "@/features/showroom/components/ShowroomProductDetailPage";
import { resolveAppLocale } from "@/utils/locale";

interface ShowroomProductDetailRouteProps {
  params: Promise<{
    locale: string;
    productId: string;
  }>;
}

export default async function ShowroomProductDetailRoute({
  params,
}: ShowroomProductDetailRouteProps) {
  const { locale, productId } = await params;
  const currentLocale = resolveAppLocale(locale);

  return (
    <ShowroomProductDetailPage
      locale={currentLocale}
      productId={productId}
    />
  );
}
