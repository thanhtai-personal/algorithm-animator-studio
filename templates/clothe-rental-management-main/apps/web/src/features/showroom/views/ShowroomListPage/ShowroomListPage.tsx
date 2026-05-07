"use client";

import { observer } from "mobx-react-lite";
import type { AppLocale } from "@/constants/locale";
import { ShowroomTemplateRenderer } from "@/features/showroom/components/ShowroomTemplateRenderer";
import { useShowroomListPage } from "@/features/showroom/hooks/useShowroomListPage";
import type { PublicShowroomPageConfigDto } from "@/types/settingsModule";

interface ShowroomListPageProps {
  locale: AppLocale;
  initialSearch?: string;
  showroomSlug?: string | null;
  branchSlug?: string | null;
  shopDomain?: string | null;
  initialConfig?: PublicShowroomPageConfigDto | null;
}

export const ShowroomListPage = observer(function ShowroomListPage({
  locale,
  initialSearch,
  showroomSlug,
  branchSlug,
  shopDomain,
  initialConfig,
}: ShowroomListPageProps) {
  const model = useShowroomListPage(locale, {
    initialSearch,
    showroomSlug,
    branchSlug,
    shopDomain,
    initialConfig,
  });

  return (
    <ShowroomTemplateRenderer
      locale={locale}
      pageKey={model.viewConfig.pageKey}
      templateCode={model.viewConfig.templateCode}
      model={model}
    />
  );
});
