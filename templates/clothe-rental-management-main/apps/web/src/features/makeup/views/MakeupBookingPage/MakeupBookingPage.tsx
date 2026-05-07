"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { observer } from "mobx-react-lite";
import { ArrowLeft, X } from "lucide-react";
import type { AppLocale } from "@/constants/locale";
import { PublicSiteHeader } from "@/components/layout/PublicSiteHeader";
import { useThemeMode } from "@/lib/themeVariants";
import { CustomerAccountPanel } from "@/features/product-landing/components/CustomerAccountPanel";
import {
  buildProductLanding3DTemplateCopy,
  migrateLegacyProductLanding3DThemeConfig,
} from "@/features/product-landing/config/productLandingTheme3D";
import { ProductLandingTemplate3DHeader } from "@/features/product-landing/components/templates/three-d/ProductLandingTemplate3DHeader";
import { useProductLandingTemplate3DState } from "@/features/product-landing/components/templates/three-d/useProductLandingTemplate3DState";
import { MakeupBookingConfirmForm } from "@/features/makeup/components/MakeupBookingConfirmForm";
import { MakeupBookingVoiceInputSection } from "@/features/makeup/components/MakeupBookingVoiceInputSection";
import { useMakeupProductBooking } from "@/features/makeup/hooks/useMakeupProductBooking";
import { SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_3D } from "@/features/showroom/constants";
import { useShowroomShell } from "@/features/showroom/hooks/useShowroomShell";
import { showroomStore } from "@/features/showroom/stores/showroomStore";
import { normalizeShowroomTemplateCode } from "@/features/showroom/utils/showroomConfig";
import type { ShowroomThemeVariant } from "@/features/showroom/utils/showroomTheme";
import { resolveShowroomThemeVariant } from "@/features/showroom/utils/showroomTheme";
import styles from "@/features/product-landing/components/templates/three-d/templateAnimations3D.module.css";
import type {
  PublicShowroomPageConfigDto,
  PublicSiteBrandingDto,
} from "@/types/settingsModule";
import { cn } from "@/utils/className";

interface MakeupBookingPageProps {
  locale: AppLocale;
  initialBranding?: PublicSiteBrandingDto | null;
  initialShowroomConfig?: PublicShowroomPageConfigDto | null;
}

interface BookingThemeSurfaceClasses {
  pageClass: string;
  heroPanelClass: string;
  contentClass: string;
}

const COPY: Record<AppLocale, { pageTag: string; backToProduct: string; closeAction: string }> = {
  vi: {
    pageTag: "Trang đặt lịch makeup",
    backToProduct: "Quay lại trang sản phẩm",
    closeAction: "Đóng",
  },
  en: {
    pageTag: "Makeup booking page",
    backToProduct: "Back to product page",
    closeAction: "Close",
  },
};

const BOOKING_THEME_SURFACES: Record<ShowroomThemeVariant, BookingThemeSurfaceClasses> = {
  default: {
    pageClass: "bg-gradient-background",
    heroPanelClass: "border-border bg-card shadow-sm",
    contentClass: "",
  },
  charm: {
    pageClass:
      "bg-[radial-gradient(circle_at_18%_8%,hsl(340_85%_93%),transparent_52%),linear-gradient(180deg,hsl(340_42%_97%),hsl(340_30%_95%))]",
    heroPanelClass:
      "border-rose-200/75 bg-white/95 shadow-[0_16px_38px_-30px_hsl(340_62%_52%)]",
    contentClass: "",
  },
  modern: {
    pageClass:
      "bg-[radial-gradient(circle_at_26%_7%,hsl(36_85%_93%),transparent_52%),linear-gradient(180deg,hsl(34_46%_97%),hsl(31_34%_95%))]",
    heroPanelClass:
      "border-amber-200/75 bg-[hsl(32_50%_98%)] shadow-[0_16px_36px_-30px_hsl(30_34%_32%)]",
    contentClass: "",
  },
  showcase3d: {
    pageClass:
      "bg-[radial-gradient(circle_at_10%_8%,hsl(var(--kata-primary)/0.14),transparent_44%),linear-gradient(180deg,hsl(var(--kata-background)),hsl(var(--kata-background)))]",
    heroPanelClass:
      "border-[hsl(var(--kata-border)/0.55)] bg-[hsl(var(--kata-card)/0.82)] shadow-[0_18px_42px_-32px_hsl(var(--kata-primary)/0.36)] backdrop-blur-xl",
    contentClass: "text-[hsl(var(--kata-foreground))]",
  },
};

export const MakeupBookingPage = observer(function MakeupBookingPage({
  locale,
  initialBranding,
  initialShowroomConfig,
}: MakeupBookingPageProps) {
  const copy = COPY[locale];
  const headerModel = useShowroomShell({ initialConfig: initialShowroomConfig });
  const { mode } = useThemeMode();
  const currentConfig = showroomStore.config ?? initialShowroomConfig ?? null;
  const bookingModel = useMakeupProductBooking(locale, {
    publicBranchId: currentConfig?.branchId ?? null,
  });
  const [mobileConfirmOpen, setMobileConfirmOpen] = useState(false);
  const initialSiteLogoUrl =
    mode === "dark"
      ? initialBranding?.siteLogoDarkUrl ?? initialBranding?.siteLogoUrl ?? null
      : initialBranding?.siteLogoUrl ?? initialBranding?.siteLogoDarkUrl ?? null;
  const siteLogoUrl = initialSiteLogoUrl ?? headerModel.siteLogoUrl;
  const normalizedTemplateCode = normalizeShowroomTemplateCode(currentConfig?.templateCode);
  const themeVariant = resolveShowroomThemeVariant(normalizedTemplateCode);
  const bookingTheme = BOOKING_THEME_SURFACES[themeVariant];
  const is3DTemplate = normalizedTemplateCode === SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_3D;
  const theme3dConfig = useMemo(() => {
    if (!is3DTemplate) return null;

    return migrateLegacyProductLanding3DThemeConfig({
      locale,
      title: currentConfig?.title ?? null,
      subtitle: currentConfig?.subtitle ?? null,
      heroConfigJson: currentConfig?.heroConfigJson,
      sectionsConfigJson: currentConfig?.sectionsConfigJson,
      seoConfigJson: currentConfig?.seoConfigJson,
      displayConfigJson: currentConfig?.displayConfigJson,
      themeConfigJson: currentConfig?.themeConfigJson,
    });
  }, [currentConfig, is3DTemplate, locale]);
  const themedCopy = useMemo(() => {
    if (!theme3dConfig) return null;

    return buildProductLanding3DTemplateCopy({
      config: theme3dConfig,
      lang: locale === "vi" ? "vi" : "en",
      locale,
      featuredProducts: [],
    });
  }, [locale, theme3dConfig]);
  const {
    mode: templateMode,
    palette,
    scrolled,
    searchQuery,
    settingsOpen,
    setMode,
    setPalette,
    setSearchQuery,
    setSettingsOpen,
    themeStyle,
  } = useProductLandingTemplate3DState(false, {
    mode: theme3dConfig?.appearance.defaultMode,
    palette: theme3dConfig?.appearance.defaultPalette,
    initialSearch: headerModel.searchQuery,
  });

  return (
    <div
      style={is3DTemplate ? themeStyle : undefined}
      className={cn(
        "min-h-screen bg-background text-foreground",
        bookingTheme.pageClass,
        bookingTheme.contentClass,
        is3DTemplate ? styles.templateScope : ""
      )}
    >
      {is3DTemplate && themedCopy ? (
        <ProductLandingTemplate3DHeader
          brandName={headerModel.copy.brand}
          copy={themedCopy}
          lang={locale === "vi" ? "vi" : "en"}
          mode={templateMode}
          palette={palette}
          scrolled={scrolled}
          searchQuery={searchQuery}
          settingsOpen={settingsOpen}
          logoUrl={siteLogoUrl}
          authActionLabel={
            headerModel.hasCloudSession
              ? headerModel.copy.logoutAction
              : headerModel.copy.loginAction
          }
          authHref={headerModel.hrefs.auth}
          hasCloudSession={headerModel.hasCloudSession}
          homeHref={headerModel.hrefs.home}
          onAuthAction={() => void headerModel.handleSignOut()}
          onSelectLanguage={headerModel.switchLocale}
          onSubmitSearch={headerModel.submitSearch}
          setMode={setMode}
          setPalette={setPalette}
          setSearchQuery={setSearchQuery}
          setSettingsOpen={setSettingsOpen}
          shortlistCount={headerModel.shortlistCount}
          shortlistHref={headerModel.hrefs.shortlist}
        />
      ) : (
        <PublicSiteHeader
          copy={headerModel.copy}
          currentLocale={headerModel.currentLocale}
          switchLocale={headerModel.switchLocale}
          searchOpen={headerModel.searchOpen}
          setSearchOpen={headerModel.setSearchOpen}
          searchQuery={headerModel.searchQuery}
          submitSearch={headerModel.submitSearch}
          siteLogoUrl={siteLogoUrl}
          shortlistCount={headerModel.shortlistCount}
          isHomeActive={headerModel.isHomeActive}
          isShortlistActive={headerModel.isShortlistActive}
          hrefs={headerModel.hrefs}
          hasCloudSession={headerModel.hasCloudSession}
          handleSignOut={headerModel.handleSignOut}
        />
      )}

      <CustomerAccountPanel />

      <section className={cn("px-4 pb-2 pt-6 md:pb-4 md:pt-8", is3DTemplate ? "pt-28 md:pt-32" : "")}>
        <div
          className={cn(
            "relative mx-auto max-w-7xl overflow-hidden rounded-3xl border px-6 py-12 md:px-8 md:py-16",
            bookingTheme.heroPanelClass
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-accent/20" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {copy.pageTag}
          </p>
          <div className="relative">
            <h1 className="mt-3 text-3xl font-extrabold md:text-5xl">{bookingModel.copy.title}</h1>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground md:text-base">
              {bookingModel.copy.subtitle}
            </p>

            <Link
              href={headerModel.hrefs.home}
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {copy.backToProduct}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-6 md:py-8">
        <div className="md:hidden">
          <MakeupBookingVoiceInputSection
            model={bookingModel}
            locale={locale}
            onParsedSuccess={() => setMobileConfirmOpen(true)}
          />
        </div>

        <div className="hidden md:block">
          <div className="mx-auto max-w-3xl space-y-4">
            <MakeupBookingVoiceInputSection model={bookingModel} locale={locale} />
            <MakeupBookingConfirmForm model={bookingModel} />
          </div>
        </div>
      </section>

      <div
        className={cn(
          "fixed inset-0 z-[180] md:hidden transition-opacity duration-200",
          mobileConfirmOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!mobileConfirmOpen}
      >
        <button
          type="button"
          aria-label={copy.closeAction}
          className="absolute inset-0 bg-black/40"
          onClick={() => setMobileConfirmOpen(false)}
        />

        <section
          className={cn(
            "absolute inset-x-0 bottom-0 flex max-h-[86vh] flex-col overflow-hidden rounded-t-3xl border shadow-xl transition-transform duration-200",
            bookingTheme.heroPanelClass,
            mobileConfirmOpen ? "translate-y-0" : "translate-y-full"
          )}
          role="dialog"
          aria-modal="true"
          aria-label={bookingModel.copy.formTitle}
        >
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">{bookingModel.copy.formTitle}</h2>
            <button
              type="button"
              aria-label={copy.closeAction}
              className="rounded-lg border border-border bg-background p-1.5 text-muted-foreground"
              onClick={() => setMobileConfirmOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
            <MakeupBookingConfirmForm
              model={bookingModel}
              showTitle={false}
              absoluteFooter
              className="border-0 bg-transparent p-0 shadow-none"
              onBookingSuccess={() => setMobileConfirmOpen(false)}
            />
          </div>
        </section>
      </div>
    </div>
  );
});
