import { notFound } from "next/navigation";
import { type DashboardModuleSegment } from "@/features/app-shell/constants";
import { DashboardModulePlaceholder } from "@/features/app-shell/components/DashboardModulePlaceholder";
import { resolveAppLocale } from "@/utils/locale";

const DASHBOARD_MODULE_SEGMENTS: DashboardModuleSegment[] = [
  "orders",
  "inventory",
  "products",
  "media",
  "categories",
  "customers",
  "payments",
  "calendar",
  "makeup",
  "reports",
  "settings",
];

const MODULE_SEGMENT_SET = new Set<DashboardModuleSegment>(DASHBOARD_MODULE_SEGMENTS);

function normalizeModuleSegment(value: string): DashboardModuleSegment | null {
  if (MODULE_SEGMENT_SET.has(value as DashboardModuleSegment)) {
    return value as DashboardModuleSegment;
  }
  return null;
}

interface DashboardModulePageProps {
  params: Promise<{ locale: string; module: string }>;
}

export default async function DashboardModulePage({
  params,
}: DashboardModulePageProps) {
  const { locale, module } = await params;
  const currentLocale = resolveAppLocale(locale);
  const normalizedModule = normalizeModuleSegment(module);
  if (!normalizedModule) {
    notFound();
  }

  return (
    <DashboardModulePlaceholder locale={currentLocale} module={normalizedModule} />
  );
}
