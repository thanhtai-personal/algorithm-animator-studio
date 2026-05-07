"use client";

import { useRouter } from "next/navigation";
import type { AppLocale } from "@/constants/locale";
import {
  buildDefaultProductLandingModernThemeConfig,
  buildProductLandingModernTemplateCopy,
} from "@/features/product-landing/config/productLandingThemeModern";
import { localizePathname } from "@/utils/locale";
import {
  buildBranchProductPath,
  buildShowroomShortlistPath,
} from "@/features/showroom/utils/paths";
import type { ProductLandingTemplateModel } from "../shared/productLandingTemplateModel";
import type { ProductLandingTemplateShell } from "../shared/productLandingTemplateShell";
import { ProductLandingTemplateModernHeader } from "./ProductLandingTemplateModernHeader";
import { ProductLandingTemplateModernSections } from "./ProductLandingTemplateModernSections";
import styles from "./templateAnimationsModern.module.css";

interface ProductLandingTemplateModernProps {
  locale: AppLocale;
  model: ProductLandingTemplateModel;
  bookingPath: string;
  bookingActionLabel: string;
  hideTemplateHeader?: boolean;
  shell?: ProductLandingTemplateShell;
}

export function ProductLandingTemplateModern({
  locale,
  model,
  bookingPath,
  bookingActionLabel,
  hideTemplateHeader = false,
  shell,
}: ProductLandingTemplateModernProps) {
  const router = useRouter();
  const homeHref = shell?.homeHref ?? buildBranchProductPath(locale, model.branchSlug, model.shopDomain);
  const showroomHref = shell?.showroomHref ?? model.showroomPath;
  const shortlistHref =
    shell?.shortlistHref ??
    buildShowroomShortlistPath(locale, model.showroomSlug, model.branchSlug, model.shopDomain);
  const authHref = shell?.authHref ?? localizePathname("/auth", locale);
  const themeModernConfig = model.themeModernConfig ?? buildDefaultProductLandingModernThemeConfig();
  const copy = buildProductLandingModernTemplateCopy({
    config: themeModernConfig,
    locale,
    featuredProducts: model.featuredProducts,
  });
  const authActionLabel = shell?.authActionLabel ?? copy.navigation.authActionLabel;
  const searchPlaceholder = copy.navigation.searchPlaceholder;

  const submitSearch = (query: string) => {
    if (shell?.submitSearch) {
      shell.submitSearch(query);
      return;
    }

    const trimmed = query.trim();
    router.push(trimmed ? `${showroomHref}?q=${encodeURIComponent(trimmed)}` : showroomHref);
  };

  return (
    <div className={`${styles.templateScope} kata-modern-root min-h-screen`}>
      {!hideTemplateHeader ? (
        <ProductLandingTemplateModernHeader
          authActionLabel={authActionLabel}
          authHref={authHref}
          cartLabel={copy.navigation.cartLabel}
          hasCloudSession={shell?.hasCloudSession ?? false}
          currentLocale={locale}
          homeHref={homeHref}
          initialSearchQuery={shell?.searchQuery ?? ""}
          siteLogoUrl={shell?.siteLogoUrl ?? model.pageLogoUrl}
          onAuthAction={shell?.handleAuthAction}
          onSwitchLocale={(nextLocale) => shell?.switchLocale(nextLocale)}
          onSubmitSearch={submitSearch}
          searchPlaceholder={searchPlaceholder}
          shortlistCount={shell?.shortlistCount ?? 0}
          shortlistHref={shortlistHref}
        />
      ) : null}

      <main className={hideTemplateHeader ? "" : "pt-28 md:pt-16"}>
        <ProductLandingTemplateModernSections
          copy={copy}
          authHref={authHref}
          bookingActionLabel={bookingActionLabel}
          bookingPath={bookingPath}
          contactInfo={model.contactInfo}
          homeHref={homeHref}
          onOpenShowroom={model.openShowroom}
          showroomHref={showroomHref}
          socialLinks={model.socialLinks}
        />
      </main>
    </div>
  );
}
