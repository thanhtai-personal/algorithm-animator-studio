import { redirect } from "next/navigation";
import { resolveAppLocale } from "@/utils/locale";

interface LocaleIndexPageProps {
  params: Promise<{ locale: string }>;
}

export default async function LocaleIndexPage({ params }: LocaleIndexPageProps) {
  const { locale } = await params;
  const normalizedLocale = resolveAppLocale(locale);

  redirect(`/${normalizedLocale}/product`);
}
