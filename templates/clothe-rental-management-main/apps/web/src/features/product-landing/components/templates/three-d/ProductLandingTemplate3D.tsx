"use client";

import { useRouter } from "next/navigation";
import type { AppLocale } from "@/constants/locale";
import {
  buildDefaultProductLanding3DThemeConfig,
  buildProductLanding3DTemplateCopy,
} from "@/features/product-landing/config/productLandingTheme3D";
import {
  buildBranchProductPath,
  buildShowroomShortlistPath,
} from "@/features/showroom/utils/paths";
import { localizePathname } from "@/utils/locale";
import { ProductLandingTemplate3DHeader } from "./ProductLandingTemplate3DHeader";
import type { ProductLandingTemplateModel } from "../shared/productLandingTemplateModel";
import type { ProductLandingTemplateShell } from "../shared/productLandingTemplateShell";
import { resolveBrandDisplayName } from "../shared/resolveBrandDisplayName";
import styles from "./templateAnimations3D.module.css";
import { useProductLandingTemplate3DState } from "./useProductLandingTemplate3DState";
import { ProductLandingTemplate3DSections } from "./ProductLandingTemplate3DSections";

interface ProductLandingTemplate3DProps {
  locale: AppLocale;
  model: ProductLandingTemplateModel;
  bookingPath: string;
  bookingActionLabel: string;
  hideTemplateHeader?: boolean;
  shell?: ProductLandingTemplateShell;
}

export function ProductLandingTemplate3D({
  locale,
  model,
  bookingPath,
  bookingActionLabel,
  hideTemplateHeader = false,
  shell,
}: ProductLandingTemplate3DProps) {
  const router = useRouter();
  const theme3dConfig = model.theme3dConfig ?? buildDefaultProductLanding3DThemeConfig();
  const lang = locale === "vi" ? "vi" : "en";
  const {
    mode,
    pageRef,
    palette,
    scrolled,
    searchQuery,
    settingsOpen,
    setMode,
    setPalette,
    setSearchQuery,
    setSettingsOpen,
    themeStyle,
  } = useProductLandingTemplate3DState(hideTemplateHeader, {
    mode: theme3dConfig.appearance.defaultMode,
    palette: theme3dConfig.appearance.defaultPalette,
    initialSearch: shell?.searchQuery,
  });

  const copy = buildProductLanding3DTemplateCopy({
    config: theme3dConfig,
    lang,
    locale,
    featuredProducts: model.featuredProducts,
  });
  const brandName = resolveBrandDisplayName({
    branchName: model.branchName,
    pageName: model.pageName,
    fallback: "KATA",
  });
  const homeHref =
    shell?.homeHref ?? buildBranchProductPath(locale, model.branchSlug, model.shopDomain);
  const showroomHref = shell?.showroomHref ?? model.showroomPath;
  const shortlistHref =
    shell?.shortlistHref ??
    buildShowroomShortlistPath(locale, model.showroomSlug, model.branchSlug, model.shopDomain);
  const authHref = shell?.authHref ?? localizePathname("/auth", locale);
  const heroImage =
    theme3dConfig.hero.heroImagePath ??
    model.featuredProducts[0]?.coverImageUrl ??
    copy.products[0]?.image ??
    "/template-assets/kata-3d/hero-dress.jpg";

  const submitSearch = (query: string) => {
    if (shell?.submitSearch) {
      shell.submitSearch(query);
      return;
    }

    const trimmed = query.trim();
    router.push(trimmed ? `${showroomHref}?q=${encodeURIComponent(trimmed)}` : showroomHref);
  };

  return (
    <div
      ref={pageRef}
      style={themeStyle}
      className={`${styles.templateScope} relative min-h-screen overflow-hidden bg-[hsl(var(--kata-background))] text-[hsl(var(--kata-foreground))]`}
    >
      {!hideTemplateHeader ? (
        <ProductLandingTemplate3DHeader
          brandName={brandName}
          copy={copy}
          lang={lang}
          mode={mode}
          palette={palette}
          scrolled={scrolled}
          searchQuery={searchQuery}
          settingsOpen={settingsOpen}
          logoUrl={shell?.siteLogoUrl ?? model.pageLogoUrl}
          authActionLabel={shell?.authActionLabel ?? copy.navLogin}
          authHref={authHref}
          hasCloudSession={shell?.hasCloudSession ?? false}
          homeHref={homeHref}
          onAuthAction={shell?.handleAuthAction}
          onSelectLanguage={(nextLang) => {
            shell?.switchLocale(nextLang === "vi" ? "vi" : "en");
          }}
          onSubmitSearch={submitSearch}
          shortlistCount={shell?.shortlistCount ?? 0}
          shortlistHref={shortlistHref}
          setMode={setMode}
          setPalette={setPalette}
          setSearchQuery={setSearchQuery}
          setSettingsOpen={setSettingsOpen}
        />
      ) : null}

      <ProductLandingTemplate3DSections
        model={model}
        brandName={brandName}
        bookingPath={bookingPath}
        bookingActionLabel={bookingActionLabel}
        hideTemplateHeader={hideTemplateHeader}
        copy={copy}
        heroImage={heroImage}
        searchQuery={searchQuery}
      />
    </div>
  );
}
