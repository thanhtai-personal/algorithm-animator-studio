import { MakeupArtistSchedulePage } from "@/features/makeup/components/MakeupArtistSchedulePage";
import { resolveAppLocale } from "@/utils/locale";

interface MakeupArtistScheduleRoutePageProps {
  params: Promise<{ locale: string; artistProfileId: string }>;
}

export default async function MakeupArtistScheduleRoutePage({
  params,
}: MakeupArtistScheduleRoutePageProps) {
  const { locale, artistProfileId } = await params;
  const currentLocale = resolveAppLocale(locale);

  return <MakeupArtistSchedulePage locale={currentLocale} artistProfileId={artistProfileId} />;
}
