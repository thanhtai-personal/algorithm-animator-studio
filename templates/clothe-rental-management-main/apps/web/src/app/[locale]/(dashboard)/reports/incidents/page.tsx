import dynamic from "next/dynamic";
import type { AppLocale } from "@/constants/locale";
import { resolveAppLocale } from "@/utils/locale";

const IncidentsReportPage = dynamic<{ locale: AppLocale }>(
  () =>
    import("@/features/reports/components/IncidentsReportPage").then(
      (module) => module.IncidentsReportPage
    ),
  {
    loading: () => (
      <section className="animate-fade-in space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Đang tải / Loading...</p>
        </div>
      </section>
    ),
  }
);

interface IncidentsReportRoutePageProps {
  params: Promise<{ locale: string }>;
}

export default async function IncidentsReportRoutePage({
  params,
}: IncidentsReportRoutePageProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);

  return <IncidentsReportPage locale={currentLocale} />;
}
