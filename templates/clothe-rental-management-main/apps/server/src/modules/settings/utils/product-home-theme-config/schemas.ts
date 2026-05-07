import {
  SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_3D,
  SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_CHARM,
  SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_MODERN,
} from './constants';
import type { ProductLandingThemeConfigSchema } from './types';

export function buildProductLanding3DThemeConfigSchema(): ProductLandingThemeConfigSchema {
  return {
    version: 1,
    themeCode: SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_3D,
    editor: 'theme-3d',
    title: 'KATA 3D Theme Config',
    fieldGroups: [
      { key: 'meta', title: 'Branding + SEO' },
      { key: 'navigation', title: 'Header / Navigation' },
      { key: 'hero', title: 'Hero 3D' },
      { key: 'collection', title: 'Featured Collection' },
      { key: 'services', title: 'Services + Stats' },
      { key: 'reviews', title: 'Testimonials + CTA' },
      { key: 'footer', title: 'Footer' },
      { key: 'products', title: 'Featured Products + Display Toggles' },
    ],
  };
}

export function buildProductLandingCharmThemeConfigSchema(): ProductLandingThemeConfigSchema {
  return {
    version: 1,
    themeCode: SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_CHARM,
    editor: 'theme-charm',
    title: 'KATA Charm Theme Config',
    fieldGroups: [
      { key: 'meta', title: 'Branding' },
      { key: 'navigation', title: 'Header / Navigation' },
      { key: 'hero', title: 'Hero + Search' },
      { key: 'featured', title: 'Featured Products' },
      { key: 'features', title: 'Feature Blocks' },
      { key: 'testimonials', title: 'Testimonials + CTA' },
      { key: 'footer', title: 'Footer' },
      { key: 'products', title: 'Display Toggles + Product Selection' },
    ],
  };
}

export function buildProductLandingModernThemeConfigSchema(): ProductLandingThemeConfigSchema {
  return {
    version: 1,
    themeCode: SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_MODERN,
    editor: 'theme-modern',
    title: 'KATA Modern Theme Config',
    fieldGroups: [
      { key: 'meta', title: 'Branding + SEO' },
      { key: 'navigation', title: 'Header / Navigation' },
      { key: 'hero', title: 'Hero' },
      { key: 'products', title: 'Featured Products' },
      { key: 'features', title: 'Feature Blocks' },
      { key: 'testimonials', title: 'Testimonials' },
      { key: 'cta', title: 'CTA' },
      { key: 'footer', title: 'Footer' },
      { key: 'display', title: 'Display Toggles' },
    ],
  };
}

export function buildShowroomTemplateConfigSchema(
  templateCode: string,
): ProductLandingThemeConfigSchema {
  if (templateCode === SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_3D) {
    return buildProductLanding3DThemeConfigSchema();
  }
  if (templateCode === SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_CHARM) {
    return buildProductLandingCharmThemeConfigSchema();
  }
  if (templateCode === SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_MODERN) {
    return buildProductLandingModernThemeConfigSchema();
  }

  return {
    version: 1,
    themeCode: templateCode,
    editor: 'legacy',
    title: 'Legacy Product Home Config',
    fieldGroups: [
      { key: 'hero', title: 'Hero' },
      { key: 'featured', title: 'Featured Products' },
      { key: 'content', title: 'Packages + Testimonials' },
      { key: 'display', title: 'Display Toggles' },
    ],
  };
}
