import { redirect } from "next/navigation";
import { resolveAppLocale } from "@/utils/locale";

interface ReportsRoutePageProps {
  params: Promise<{ locale: string }>;
}

export default async function ReportsRoutePage({ params }: ReportsRoutePageProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);

  redirect(`/${currentLocale}/reports/revenue`);
}
