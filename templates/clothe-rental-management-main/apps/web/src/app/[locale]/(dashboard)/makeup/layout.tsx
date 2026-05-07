import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { MakeupAdminTabs } from "@/features/makeup/components/MakeupAdminTabs";
import { getPublicSiteBrandingFromNest } from "@/server/services/publicBrandingService";
import { resolveAppLocale } from "@/utils/locale";

interface MakeupDashboardLayoutProps {
  params: Promise<{ locale: string }>;
  children: ReactNode;
}

export default async function MakeupDashboardLayout({
  params,
  children,
}: MakeupDashboardLayoutProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);
  const branding = await getPublicSiteBrandingFromNest();

  if (!branding.isMakeupModuleEnabled) {
    notFound();
  }

  return (
    <section className="space-y-4">
      <MakeupAdminTabs locale={currentLocale} />
      {children}
    </section>
  );
}
