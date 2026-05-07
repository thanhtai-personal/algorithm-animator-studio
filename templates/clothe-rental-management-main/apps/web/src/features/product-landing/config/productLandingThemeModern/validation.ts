import type { LocalizedText, ProductLandingModernThemeConfig } from "./types";
import { readString } from "./utils";

export function validateProductLandingModernThemeConfig(
  config: ProductLandingModernThemeConfig
): string[] {
  const errors: string[] = [];
  const requiredLocalizedFields: Array<[string, LocalizedText]> = [
    ["meta.pageName", config.meta.pageName],
    ["navigation.searchPlaceholder", config.navigation.searchPlaceholder],
    ["hero.badge", config.hero.badge],
    ["hero.line1", config.hero.line1],
    ["hero.line2", config.hero.line2],
    ["hero.subtitle", config.hero.subtitle],
    ["products.title", config.products.title],
    ["cta.subtitle", config.cta.subtitle],
  ];

  for (const [path, field] of requiredLocalizedFields) {
    if (!readString(field.vi) || !readString(field.en)) {
      errors.push(`${path} requires both vi and en`);
    }
  }

  if (config.stats.length === 0) {
    errors.push("stats requires at least one item");
  }
  if (config.featureItems.length === 0) {
    errors.push("featureItems requires at least one item");
  }
  if (config.testimonialItems.length === 0) {
    errors.push("testimonialItems requires at least one item");
  }

  return errors;
}
