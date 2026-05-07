import { notFound, redirect } from "next/navigation";
import { assertPublicBranchSlugExists } from "@/server/services/showroomPublicService";
import { localizePathname, resolveAppLocale } from "@/utils/locale";

interface BranchPosRouteProps {
  params: Promise<{ locale: string; branchSlug: string }>;
}

export default async function BranchPosRoute({ params }: BranchPosRouteProps) {
  const { locale, branchSlug } = await params;
  const currentLocale = resolveAppLocale(locale);
  const branchExists = await assertPublicBranchSlugExists(branchSlug, {
    revalidate: 300,
  });

  if (!branchExists) {
    notFound();
  }

  const salesPosPath = localizePathname("/sales/pos", currentLocale);
  redirect(`${salesPosPath}?branchSlug=${encodeURIComponent(branchSlug)}`);
}
