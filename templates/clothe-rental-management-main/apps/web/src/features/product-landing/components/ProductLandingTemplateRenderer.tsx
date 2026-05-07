"use client";

import type { ReactNode } from "react";
import type { AppLocale } from "@/constants/locale";
import {
  SHOWROOM_DEFAULT_TEMPLATE_CODE,
  SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_3D,
  SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_CHARM,
  SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_MODERN,
} from "@/features/showroom/constants";
import { normalizeShowroomTemplateCode } from "@/features/showroom/utils/showroomConfig";
import { ProductLandingTemplate3D } from "@/features/product-landing/components/templates/three-d/ProductLandingTemplate3D";
import { ProductLandingTemplateCharm } from "@/features/product-landing/components/templates/charm/ProductLandingTemplateCharm";
import { ProductLandingTemplateDefault } from "@/features/product-landing/components/templates/default/ProductLandingTemplateDefault";
import { ProductLandingTemplateModern } from "@/features/product-landing/components/templates/modern/ProductLandingTemplateModern";
import type { ProductLandingTemplateModel } from "@/features/product-landing/components/templates/shared/productLandingTemplateModel";
import type { ProductLandingTemplateShell } from "@/features/product-landing/components/templates/shared/productLandingTemplateShell";

interface ProductLandingTemplateRendererProps {
  locale: AppLocale;
  model: ProductLandingTemplateModel;
  bookingPath: string;
  bookingActionLabel: string;
  hideTemplateHeader?: boolean;
  shell?: ProductLandingTemplateShell;
}

type ProductLandingRendererFn = (props: ProductLandingTemplateRendererProps) => ReactNode;

const PRODUCT_LANDING_TEMPLATE_REGISTRY: Record<string, ProductLandingRendererFn> = {
  [SHOWROOM_DEFAULT_TEMPLATE_CODE]: (props) => <ProductLandingTemplateDefault {...props} />,
  [SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_CHARM]: (props) => <ProductLandingTemplateCharm {...props} />,
  [SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_MODERN]: (props) => <ProductLandingTemplateModern {...props} />,
  [SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_3D]: (props) => <ProductLandingTemplate3D {...props} />,
};

export function ProductLandingTemplateRenderer(props: ProductLandingTemplateRendererProps) {
  const normalizedTemplateCode = normalizeShowroomTemplateCode(props.model.templateCode);
  const renderer =
    PRODUCT_LANDING_TEMPLATE_REGISTRY[normalizedTemplateCode] ??
    PRODUCT_LANDING_TEMPLATE_REGISTRY[SHOWROOM_DEFAULT_TEMPLATE_CODE];

  if (!PRODUCT_LANDING_TEMPLATE_REGISTRY[normalizedTemplateCode]) {
    console.warn("[product-landing] unsupported template code, fallback to default", {
      requestedTemplateCode: props.model.templateCode,
      normalizedTemplateCode,
      fallbackTemplateCode: SHOWROOM_DEFAULT_TEMPLATE_CODE,
      branchSlug: props.model.branchSlug,
      showroomSlug: props.model.showroomSlug,
    });
  }

  return renderer(props);
}
