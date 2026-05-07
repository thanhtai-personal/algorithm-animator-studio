import { redirect } from "next/navigation";
import { resolveAppLocale } from "@/utils/locale";

interface SalesDeskAliasPageProps {
  params: Promise<{ locale: string }>;
}

export default async function SalesDeskAliasPage({ params }: SalesDeskAliasPageProps) {
  const { locale } = await params;
  const normalizedLocale = resolveAppLocale(locale);
  redirect(`/${normalizedLocale}/sales/pos`);
}
