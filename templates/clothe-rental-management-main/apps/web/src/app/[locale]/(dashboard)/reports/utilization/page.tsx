import dynamic from "next/dynamic";
import type { AppLocale } from "@/constants/locale";
import { resolveAppLocale } from "@/utils/locale";

const UtilizationReportPage = dynamic<{ locale: AppLocale }>(
  () =>
    import("@/features/reports/components/UtilizationReportPage").then(
      (module) => module.UtilizationReportPage
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

interface UtilizationReportRoutePageProps {
  params: Promise<{ locale: string }>;
}

export default async function UtilizationReportRoutePage({
  params,
}: UtilizationReportRoutePageProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);

  return <UtilizationReportPage locale={currentLocale} />;
}
