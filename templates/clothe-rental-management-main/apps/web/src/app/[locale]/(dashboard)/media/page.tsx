import { MediaLibraryPage } from "@/features/media/components/MediaLibraryPage";
import { resolveAppLocale } from "@/utils/locale";

interface MediaPageProps {
  params: Promise<{ locale: string }>;
}

export default async function MediaPage({ params }: MediaPageProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);

  return <MediaLibraryPage locale={currentLocale} />;
}
