import { notFound } from "next/navigation";
import { MakeupBookingPage } from "@/features/makeup/components/MakeupBookingPage";
import { getPublicSiteBrandingFromNest } from "@/server/services/publicBrandingService";
import { fetchPublicShowroomConfig } from "@/server/services/showroomPublicService";
import { resolveAppLocale } from "@/utils/locale";

interface BookingRouteProps {
  params: Promise<{ locale: string }>;
}

const SHOWROOM_CONFIG_PREFETCH_TIMEOUT_MS = 300;

function timeoutNull(delayMs: number): Promise<null> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(null), delayMs);
  });
}

export default async function BookingRoute({ params }: BookingRouteProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);
  const showroomConfigPromise = fetchPublicShowroomConfig({ locale: currentLocale });
  const branding = await getPublicSiteBrandingFromNest();

  if (!branding.isMakeupModuleEnabled) {
    notFound();
  }

  const initialShowroomConfig = await Promise.race([
    showroomConfigPromise,
    timeoutNull(SHOWROOM_CONFIG_PREFETCH_TIMEOUT_MS),
  ]);

  return (
    <MakeupBookingPage
      locale={currentLocale}
      initialBranding={branding}
      initialShowroomConfig={initialShowroomConfig}
    />
  );
}
