import { SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_MODERN } from "@/features/showroom/constants";
import { normalizeShowroomTemplateCode } from "@/features/showroom/utils/showroomConfig";
import type { ProductLandingThemeConfigSchema } from "@/features/product-landing/config/productLandingTheme3D";

export function isProductLandingModernTemplateCode(
  templateCode: string | null | undefined
): boolean {
  const normalized = normalizeShowroomTemplateCode(templateCode);
  if (!normalized) return false;

  return (
    normalized === SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_MODERN ||
    normalized.includes("MODERN")
  );
}

export function buildProductLandingModernThemeConfigSchema(): ProductLandingThemeConfigSchema {
  return {
    version: 1,
    themeCode: SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_MODERN,
    editor: "theme-modern",
    title: "KATA Modern Theme Config",
    fieldGroups: [
      { key: "meta", title: "Branding + SEO" },
      { key: "navigation", title: "Header / Navigation" },
      { key: "hero", title: "Hero" },
      { key: "products", title: "Featured Products" },
      { key: "features", title: "Feature Blocks" },
      { key: "testimonials", title: "Testimonials" },
      { key: "cta", title: "CTA" },
      { key: "footer", title: "Footer" },
      { key: "display", title: "Display Toggles" },
    ],
  };
}
