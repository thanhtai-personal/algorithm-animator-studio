import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { normalizeAppLocale } from "@/utils/locale";

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;
  if (!normalizeAppLocale(locale)) {
    notFound();
  }

  return <>{children}</>;
}
