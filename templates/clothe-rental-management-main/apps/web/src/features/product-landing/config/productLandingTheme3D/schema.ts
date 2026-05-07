import { SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_3D } from "@/features/showroom/constants";
import { normalizeShowroomTemplateCode } from "@/features/showroom/utils/showroomConfig";
import type { ProductLandingThemeConfigSchema } from "./types";

export function buildProductLanding3DThemeConfigSchema(): ProductLandingThemeConfigSchema {
  return {
    version: 1,
    themeCode: SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_3D,
    editor: "theme-3d",
    title: "KATA 3D Theme Config",
    fieldGroups: [
      { key: "meta", title: "Branding + SEO" },
      { key: "navigation", title: "Header / Navigation" },
      { key: "hero", title: "Hero 3D" },
      { key: "collection", title: "Featured Collection" },
      { key: "services", title: "Services + Stats" },
      { key: "reviews", title: "Testimonials + CTA" },
      { key: "footer", title: "Footer" },
      { key: "products", title: "Featured Products + Display Toggles" },
    ],
  };
}

export function isProductLanding3DTemplateCode(templateCode: string | null | undefined): boolean {
  return normalizeShowroomTemplateCode(templateCode) === SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_3D;
}
