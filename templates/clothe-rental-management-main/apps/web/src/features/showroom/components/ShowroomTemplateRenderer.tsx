"use client";

import type { AppLocale } from "@/constants/locale";
import {
  SHOWROOM_DEFAULT_TEMPLATE_CODE,
  SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_3D,
  SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_CHARM,
  SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_MODERN,
} from "@/features/showroom/constants";
import type { useShowroomListPage } from "@/features/showroom/hooks/useShowroomListPage";
import {
  normalizeShowroomTemplateCode,
} from "@/features/showroom/utils/showroomConfig";
import type { ShowroomThemeVariant } from "@/features/showroom/utils/showroomTheme";
import { resolveShowroomThemeVariant } from "@/features/showroom/utils/showroomTheme";
import { ShowroomProductHomeV1 } from "@/features/showroom/components/templates/ShowroomProductHomeV1";

type ShowroomListPageModel = ReturnType<typeof useShowroomListPage>;

type ShowroomPageKey = "PRODUCT_HOME";

type ShowroomTemplateRendererFn = (props: {
  locale: AppLocale;
  model: ShowroomListPageModel;
  themeVariant: ShowroomThemeVariant;
}) => React.ReactNode;

const SHOWROOM_RENDERER_REGISTRY: Record<
  ShowroomPageKey,
  Record<string, ShowroomTemplateRendererFn>
> = {
  PRODUCT_HOME: {
    PRODUCT_HOME_V1: ({ locale, model, themeVariant }) => (
      <ShowroomProductHomeV1 locale={locale} model={model} themeVariant={themeVariant} />
    ),
    [SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_CHARM]: ({ locale, model, themeVariant }) => (
      <ShowroomProductHomeV1 locale={locale} model={model} themeVariant={themeVariant} />
    ),
    [SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_MODERN]: ({ locale, model, themeVariant }) => (
      <ShowroomProductHomeV1 locale={locale} model={model} themeVariant={themeVariant} />
    ),
    [SHOWROOM_PRODUCT_HOME_TEMPLATE_CODE_3D]: ({ locale, model, themeVariant }) => (
      <ShowroomProductHomeV1 locale={locale} model={model} themeVariant={themeVariant} />
    ),
  },
};

interface ShowroomTemplateRendererProps {
  locale: AppLocale;
  pageKey: ShowroomPageKey;
  templateCode: string;
  model: ShowroomListPageModel;
}

export function ShowroomTemplateRenderer({
  locale,
  pageKey,
  templateCode,
  model,
}: ShowroomTemplateRendererProps) {
  const pageRegistry = SHOWROOM_RENDERER_REGISTRY[pageKey];
  const normalizedTemplateCode = normalizeShowroomTemplateCode(templateCode);

  const renderer =
    pageRegistry[normalizedTemplateCode] ??
    pageRegistry[SHOWROOM_DEFAULT_TEMPLATE_CODE];
  const themeVariant = resolveShowroomThemeVariant(normalizedTemplateCode);

  return renderer({ locale, model, themeVariant });
}
