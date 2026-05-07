import { MakeupArtistDirectoryPage } from "@/features/makeup/components/MakeupArtistDirectoryPage";
import { resolveAppLocale } from "@/utils/locale";

interface MakeupArtistsRoutePageProps {
  params: Promise<{ locale: string }>;
}

export default async function MakeupArtistsRoutePage({
  params,
}: MakeupArtistsRoutePageProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);

  return <MakeupArtistDirectoryPage locale={currentLocale} />;
}
