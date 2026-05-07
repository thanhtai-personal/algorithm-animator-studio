"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AppLocale } from "@/constants/locale";
import {
  buildDefaultProductLandingCharmThemeConfig,
  buildProductLandingCharmTemplateCopy,
  resolveProductLandingCharmHeroImage,
} from "@/features/product-landing/config/productLandingThemeCharm";
import {
  buildBranchProductPath,
  buildShowroomShortlistPath,
} from "@/features/showroom/utils/paths";
import { localizePathname } from "@/utils/locale";
import type { ProductLandingTemplateModel } from "../shared/productLandingTemplateModel";
import type { ProductLandingTemplateShell } from "../shared/productLandingTemplateShell";
import { resolveBrandDisplayName } from "../shared/resolveBrandDisplayName";
import { ProductLandingTemplateCharmHeader } from "./ProductLandingTemplateCharmHeader";
import { ProductLandingTemplateCharmSections } from "./ProductLandingTemplateCharmSections";
import styles from "./templateAnimationsCharm.module.css";

interface ProductLandingTemplateCharmProps {
  locale: AppLocale;
  model: ProductLandingTemplateModel;
  bookingPath: string;
  bookingActionLabel: string;
  hideTemplateHeader?: boolean;
  shell?: ProductLandingTemplateShell;
}

export function ProductLandingTemplateCharm({
  locale,
  model,
  bookingPath,
  bookingActionLabel,
  hideTemplateHeader = false,
  shell,
}: ProductLandingTemplateCharmProps) {
  const router = useRouter();
  const [likedProductIds, setLikedProductIds] = useState<Record<string, boolean>>({});

  const themeCharmConfig = model.themeCharmConfig ?? buildDefaultProductLandingCharmThemeConfig();
  const copy = buildProductLandingCharmTemplateCopy({
    config: themeCharmConfig,
    locale,
    featuredProducts: model.featuredProducts,
  });
  const heroImage = resolveProductLandingCharmHeroImage(themeCharmConfig);
  const brandName = resolveBrandDisplayName({
    branchName: model.branchName,
    pageName: model.pageName,
    fallback: "KATA",
  });
  const homeHref = shell?.homeHref ?? buildBranchProductPath(locale, model.branchSlug, model.shopDomain);
  const showroomHref = shell?.showroomHref ?? model.showroomPath;
  const shortlistHref =
    shell?.shortlistHref ??
    buildShowroomShortlistPath(locale, model.showroomSlug, model.branchSlug, model.shopDomain);
  const authHref = shell?.authHref ?? localizePathname("/auth", locale);

  const toggleLike = (productId: string) => {
    setLikedProductIds((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

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
      className={`${styles.templateScope} min-h-screen bg-gradient-background text-foreground [font-family:\"Quicksand\",sans-serif]`}
    >
      {!hideTemplateHeader ? (
        <ProductLandingTemplateCharmHeader
          locale={locale}
          brandName={brandName}
          copy={copy}
          authActionLabel={shell?.authActionLabel ?? copy.signInLabel}
          authHref={authHref}
          hasCloudSession={shell?.hasCloudSession ?? false}
          homeHref={homeHref}
          siteLogoUrl={shell?.siteLogoUrl ?? model.pageLogoUrl}
          onAuthAction={shell?.handleAuthAction}
          onSubmitSearch={submitSearch}
          searchQuery={shell?.searchQuery ?? ""}
          shortlistCount={shell?.shortlistCount ?? 0}
          shortlistHref={shortlistHref}
          switchLocale={(nextLocale) => shell?.switchLocale(nextLocale)}
        />
      ) : null}

      <ProductLandingTemplateCharmSections
        bookingActionLabel={bookingActionLabel}
        bookingPath={bookingPath}
        brandName={brandName}
        copy={copy}
        heroImage={heroImage}
        likedProductIds={likedProductIds}
        model={model}
        onToggleLike={toggleLike}
      />
    </div>
  );
}
