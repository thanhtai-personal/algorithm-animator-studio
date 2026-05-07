import { notFound, redirect } from "next/navigation";
import { buildShowroomBasePath } from "@/features/showroom/utils/paths";
import { getPublicBranchContextBySlug } from "@/server/services/showroomPublicService";
import { resolveAppLocale } from "@/utils/locale";

interface BranchSearchPageProps {
  params: Promise<{ locale: string; branchSlug: string }>;
  searchParams: Promise<{ q?: string }>;
}

export default async function BranchSearchPage({
  params,
  searchParams,
}: BranchSearchPageProps) {
  const { locale, branchSlug } = await params;
  const query = await searchParams;
  const q = typeof query.q === "string" ? query.q.trim() : "";
  const currentLocale = resolveAppLocale(locale);
  const branchContext = await getPublicBranchContextBySlug(branchSlug);

  if (!branchContext?.branchId) {
    notFound();
  }

  const basePath = buildShowroomBasePath(
    currentLocale,
    branchContext.showroomSlug,
    branchContext.branchSlug,
    branchContext.shopDomain
  );
  const href = q ? `${basePath}?q=${encodeURIComponent(q)}` : basePath;
  redirect(href);
}
