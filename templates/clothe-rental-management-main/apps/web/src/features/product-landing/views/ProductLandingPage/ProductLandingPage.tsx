"use client";

import { useLayoutEffect } from "react";
import { observer } from "mobx-react-lite";
import type { AppLocale } from "@/constants/locale";
import type { PublicShowroomPageConfigDto } from "@/types/settingsModule";
import { productLandingStore } from "@/features/product-landing/stores/productLandingStore";
import { PublicSiteHeader } from "@/components/layout/PublicSiteHeader";
import { CustomerAccountPanel } from "@/features/product-landing/components/CustomerAccountPanel";
import { ProductLandingTemplateRenderer } from "@/features/product-landing/components/ProductLandingTemplateRenderer";
import { useProductLandingPage } from "@/features/product-landing/hooks/useProductLandingPage";
import { useShowroomShell } from "@/features/showroom/hooks/useShowroomShell";
import {
  SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_3D,
  SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_CHARM,
  SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_MODERN,
} from "@/features/showroom/constants";
import { normalizeShowroomTemplateCode } from "@/features/showroom/utils/showroomConfig";
import { localizePathname } from "@/utils/locale";

interface ProductLandingPageProps {
  locale: AppLocale;
  branchSlug?: string | null;
  shopDomain?: string | null;
  initialConfig?: PublicShowroomPageConfigDto | null;
}

export const ProductLandingPage = observer(function ProductLandingPage({
  locale,
  branchSlug,
  shopDomain,
  initialConfig,
}: ProductLandingPageProps) {
  // If server provided an initial config, hydrate the store immediately to
  // avoid client-side fallback rendering.
  useLayoutEffect(() => {
    if (initialConfig) {
      productLandingStore.hydrateConfig(initialConfig);
    }
  }, [initialConfig]);

  const model = useProductLandingPage(locale, { branchSlug, shopDomain, initialConfig });
  const headerModel = useShowroomShell({ initialConfig });
  const bookingPath = localizePathname("/booking", locale);
  const bookingActionLabel = locale === "vi" ? "Đặt lịch makeup" : "Book makeup";
  const normalizedTemplateCode = normalizeShowroomTemplateCode(model.templateCode);
  const is3DTemplate = normalizedTemplateCode === SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_3D;
  const isModernTemplate =
    normalizedTemplateCode === SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_MODERN;
  const isCharmTemplate =
    normalizedTemplateCode === SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_CHARM;
  const useTemplateHeader = is3DTemplate || isModernTemplate || isCharmTemplate;

  const templateShell = useTemplateHeader
    ? {
        authActionLabel: headerModel.hasCloudSession
          ? headerModel.copy.logoutAction
          : headerModel.copy.loginAction,
        authHref: headerModel.hrefs.auth,
        hasCloudSession: headerModel.hasCloudSession,
        homeHref: headerModel.hrefs.home,
        siteLogoUrl: model.pageLogoUrl ?? headerModel.siteLogoUrl,
        isHomeActive: headerModel.isHomeActive,
        isShortlistActive: headerModel.isShortlistActive,
        isShowroomActive: headerModel.isShowroomActive,
        searchQuery: headerModel.searchQuery,
        showroomHref: headerModel.hrefs.showroom,
        shortlistCount: headerModel.shortlistCount,
        shortlistHref: headerModel.hrefs.shortlist,
        submitSearch: headerModel.submitSearch,
        switchLocale: headerModel.switchLocale,
        handleAuthAction: () => void headerModel.handleSignOut(),
      }
    : undefined;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!useTemplateHeader ? (
        <PublicSiteHeader
          copy={headerModel.copy}
          currentLocale={headerModel.currentLocale}
          switchLocale={headerModel.switchLocale}
          searchOpen={headerModel.searchOpen}
          setSearchOpen={headerModel.setSearchOpen}
          searchQuery={headerModel.searchQuery}
          submitSearch={headerModel.submitSearch}
          siteLogoUrl={model.pageLogoUrl ?? headerModel.siteLogoUrl}
          shortlistCount={headerModel.shortlistCount}
          isHomeActive={headerModel.isHomeActive}
          isShortlistActive={headerModel.isShortlistActive}
          hrefs={headerModel.hrefs}
          hasCloudSession={headerModel.hasCloudSession}
          handleSignOut={headerModel.handleSignOut}
        />
      ) : null}

      <CustomerAccountPanel />

      <ProductLandingTemplateRenderer
        locale={locale}
        model={model}
        bookingPath={bookingPath}
        bookingActionLabel={bookingActionLabel}
        hideTemplateHeader={!useTemplateHeader}
        shell={templateShell}
      />
    </div>
  );
});
