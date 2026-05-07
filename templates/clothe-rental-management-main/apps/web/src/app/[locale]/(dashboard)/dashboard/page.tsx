import dynamic from "next/dynamic";
import type { AppLocale } from "@/constants/locale";
import { resolveAppLocale } from "@/utils/locale";

const DashboardHomePage = dynamic<{ locale: AppLocale }>(
  () =>
    import("@/features/dashboard/components/DashboardHomePage").then(
      (module) => module.DashboardHomePage
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

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);

  return <DashboardHomePage locale={currentLocale} />;
}
