import { redirect } from "next/navigation";
import { resolveAppLocale } from "@/utils/locale";

interface SalesIndexPageProps {
  params: Promise<{ locale: string }>;
}

export default async function SalesIndexPage({ params }: SalesIndexPageProps) {
  const { locale } = await params;
  const normalizedLocale = resolveAppLocale(locale);
  redirect(`/${normalizedLocale}/sales/pos`);
}
