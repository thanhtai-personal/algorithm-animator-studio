import { ShowroomProductDetailPage } from "@/features/showroom/components/ShowroomProductDetailPage";
import { notFound } from "next/navigation";
import { assertPublicShowroomSlugExists } from "@/server/services/showroomPublicService";
import { resolveAppLocale } from "@/utils/locale";

interface ShowroomProductDetailBySlugRouteProps {
  params: Promise<{
    locale: string;
    showroomSlug: string;
    productId: string;
  }>;
}

export default async function ShowroomProductDetailBySlugRoute({
  params,
}: ShowroomProductDetailBySlugRouteProps) {
  const { locale, showroomSlug, productId } = await params;
  const currentLocale = resolveAppLocale(locale);
  const showroomExists = await assertPublicShowroomSlugExists(showroomSlug);

  if (!showroomExists) {
    notFound();
  }

  return (
    <ShowroomProductDetailPage
      locale={currentLocale}
      productId={productId}
      showroomSlug={showroomSlug}
    />
  );
}
