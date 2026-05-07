import { readString } from './helpers';
import type { LocalizedText, ProductLanding3DThemeConfig } from './types';

export function validateProductLanding3DThemeConfig(
  config: ProductLanding3DThemeConfig,
): string[] {
  const errors: string[] = [];
  const requiredLocalizedFields: Array<[string, LocalizedText]> = [
    ['meta.pageName', config.meta.pageName],
    ['navigation.searchPlaceholder', config.navigation.searchPlaceholder],
    ['hero.badge', config.hero.badge],
    ['hero.line1', config.hero.line1],
    ['hero.highlight', config.hero.highlight],
    ['hero.line3', config.hero.line3],
    ['hero.subtitle', config.hero.subtitle],
    ['collection.title', config.collection.title],
    ['cta.subtitle', config.cta.subtitle],
  ];

  for (const [path, field] of requiredLocalizedFields) {
    if (!readString(field.vi) || !readString(field.en)) {
      errors.push(`${path} requires both vi and en`);
    }
  }

  if (config.stats.length === 0) {
    errors.push('stats requires at least one item');
  }
  if (config.features.length === 0) {
    errors.push('features requires at least one item');
  }
  if (config.testimonials.length === 0) {
    errors.push('testimonials requires at least one item');
  }

  return errors;
}
