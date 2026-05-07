"use client";

import { observer } from "mobx-react-lite";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { PublicContactInfo } from "@/components/layout/PublicContactInfo";
import { PublicSocialLinks } from "@/components/layout/PublicSocialLinks";
import { PublicSiteHeader } from "@/components/layout/PublicSiteHeader";
import {
  buildProductLanding3DTemplateCopy,
  migrateLegacyProductLanding3DThemeConfig,
} from "@/features/product-landing/config/productLandingTheme3D";
import { ProductLandingTemplate3DHeader } from "@/features/product-landing/components/templates/three-d/ProductLandingTemplate3DHeader";
import { useProductLandingTemplate3DState } from "@/features/product-landing/components/templates/three-d/useProductLandingTemplate3DState";
import { SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_3D } from "@/features/showroom/constants";
import { useShowroomShell } from "@/features/showroom/hooks/useShowroomShell";
import { showroomStore } from "@/features/showroom/stores/showroomStore";
import { normalizeShowroomTemplateCode } from "@/features/showroom/utils/showroomConfig";
import styles from "@/features/product-landing/components/templates/three-d/templateAnimations3D.module.css";

interface ShowroomShellProps {
  children: ReactNode;
}

export const ShowroomShell = observer(function ShowroomShell({ children }: ShowroomShellProps) {
  const {
    copy,
    currentLocale,
    switchLocale,
    searchOpen,
    setSearchOpen,
    searchQuery,
    submitSearch,
    siteLogoUrl,
    socialLinks,
    contactInfo,
    shortlistCount,
    isHomeActive,
    isShortlistActive,
    hrefs,
    hasCloudSession,
    handleSignOut,
  } = useShowroomShell();
  const currentConfig = showroomStore.config;
  const is3DTemplate =
    normalizeShowroomTemplateCode(currentConfig?.templateCode) ===
    SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_3D;
  const theme3dConfig = useMemo(() => {
    if (!is3DTemplate) return null;

    return migrateLegacyProductLanding3DThemeConfig({
      locale: currentLocale,
      title: currentConfig?.title ?? null,
      subtitle: currentConfig?.subtitle ?? null,
      heroConfigJson: currentConfig?.heroConfigJson,
      sectionsConfigJson: currentConfig?.sectionsConfigJson,
      seoConfigJson: currentConfig?.seoConfigJson,
      displayConfigJson: currentConfig?.displayConfigJson,
      themeConfigJson: currentConfig?.themeConfigJson,
    });
  }, [currentConfig, currentLocale, is3DTemplate]);
  const {
    mode,
    palette,
    scrolled,
    searchQuery: themedSearchQuery,
    settingsOpen,
    setMode,
    setPalette,
    setSearchQuery,
    setSettingsOpen,
    themeStyle,
  } = useProductLandingTemplate3DState(false, {
    mode: theme3dConfig?.appearance.defaultMode,
    palette: theme3dConfig?.appearance.defaultPalette,
    initialSearch: searchQuery,
  });
  const themedCopy = useMemo(() => {
    if (!theme3dConfig) return null;

    return buildProductLanding3DTemplateCopy({
      config: theme3dConfig,
      lang: currentLocale === "vi" ? "vi" : "en",
      locale: currentLocale,
      featuredProducts: [],
    });
  }, [currentLocale, theme3dConfig]);

  return (
    <div
      style={is3DTemplate ? themeStyle : undefined}
      className={`${is3DTemplate ? styles.templateScope : ""} min-h-screen bg-background`}
    >
      {is3DTemplate && themedCopy ? (
        <ProductLandingTemplate3DHeader
          brandName={copy.brand}
          copy={themedCopy}
          lang={currentLocale === "vi" ? "vi" : "en"}
          mode={mode}
          palette={palette}
          scrolled={scrolled}
          searchQuery={themedSearchQuery}
          settingsOpen={settingsOpen}
          logoUrl={siteLogoUrl}
          authActionLabel={hasCloudSession ? copy.logoutAction : copy.loginAction}
          authHref={hrefs.auth}
          hasCloudSession={hasCloudSession}
          homeHref={hrefs.home}
          onAuthAction={() => void handleSignOut()}
          onSelectLanguage={switchLocale}
          onSubmitSearch={submitSearch}
          setMode={setMode}
          setPalette={setPalette}
          setSearchQuery={setSearchQuery}
          setSettingsOpen={setSettingsOpen}
          shortlistCount={shortlistCount}
          shortlistHref={hrefs.shortlist}
        />
      ) : (
        <PublicSiteHeader
          copy={copy}
          currentLocale={currentLocale}
          switchLocale={switchLocale}
          searchOpen={searchOpen}
          setSearchOpen={setSearchOpen}
          searchQuery={searchQuery}
          submitSearch={submitSearch}
          siteLogoUrl={siteLogoUrl}
          shortlistCount={shortlistCount}
          isHomeActive={isHomeActive}
          isShortlistActive={isShortlistActive}
          hrefs={hrefs}
          hasCloudSession={hasCloudSession}
          handleSignOut={handleSignOut}
        />
      )}

      <main className={`animate-fade-in ${is3DTemplate ? "pt-24" : ""}`}>{children}</main>

      <footer className="mt-12 border-t border-border py-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-3 px-4 text-center text-sm text-muted-foreground">
          <p>{copy.footer}</p>
          <PublicContactInfo info={contactInfo} />
          <PublicSocialLinks links={socialLinks} />
        </div>
      </footer>
    </div>
  );
});
