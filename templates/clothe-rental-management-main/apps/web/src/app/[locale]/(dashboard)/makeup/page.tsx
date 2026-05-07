import { redirect } from "next/navigation";
import { resolveAppLocale } from "@/utils/locale";

interface MakeupRoutePageProps {
  params: Promise<{ locale: string }>;
}

export default async function MakeupRoutePage({ params }: MakeupRoutePageProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);
  redirect(`/${currentLocale}/makeup/calendar`);
}
