import {
  SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_3D,
  SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_CHARM,
  SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_MODERN,
} from "@/features/showroom/constants";
import { normalizeShowroomTemplateCode } from "@/features/showroom/utils/showroomConfig";

export type ShowroomThemeVariant = "default" | "charm" | "modern" | "showcase3d";

export function resolveShowroomThemeVariant(templateCode: string | null | undefined): ShowroomThemeVariant {
  const normalized = normalizeShowroomTemplateCode(templateCode);

  if (normalized === SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_CHARM) {
    return "charm";
  }
  if (normalized === SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_MODERN) {
    return "modern";
  }
  if (normalized === SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_3D) {
    return "showcase3d";
  }

  return "default";
}

