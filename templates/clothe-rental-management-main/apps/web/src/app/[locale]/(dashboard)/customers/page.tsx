import { CustomersListPage } from "@/features/customers/components/CustomersListPage";
import { resolveAppLocale } from "@/utils/locale";

interface CustomersPageProps {
  params: Promise<{ locale: string }>;
}

export default async function CustomersPage({ params }: CustomersPageProps) {
  const { locale } = await params;
  const currentLocale = resolveAppLocale(locale);

  return <CustomersListPage locale={currentLocale} />;
}
