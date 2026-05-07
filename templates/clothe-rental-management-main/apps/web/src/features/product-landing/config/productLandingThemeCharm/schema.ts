import { SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_CHARM } from "@/features/showroom/constants";
import type { ProductLandingThemeConfigSchema } from "@/features/product-landing/config/productLandingTheme3D";

export function isProductLandingCharmTemplateCode(templateCode: string | null | undefined): boolean {
  const normalized = (templateCode ?? "").trim().toUpperCase();
  if (!normalized) return false;

  return (
    normalized === SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_CHARM ||
    normalized.includes("CHARM") ||
    normalized.includes("CUTE")
  );
}

export function buildProductLandingCharmThemeConfigSchema(): ProductLandingThemeConfigSchema {
  return {
    version: 1,
    themeCode: SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_CHARM,
    editor: "theme-charm",
    title: "KATA Charm Theme Config",
    fieldGroups: [
      { key: "meta", title: "Branding" },
      { key: "navigation", title: "Header / Navigation" },
      { key: "hero", title: "Hero + Search" },
      { key: "featured", title: "Featured Products" },
      { key: "features", title: "Feature Blocks" },
      { key: "testimonials", title: "Testimonials + CTA" },
      { key: "footer", title: "Footer" },
      { key: "products", title: "Display Toggles + Product Selection" },
    ],
  };
}
