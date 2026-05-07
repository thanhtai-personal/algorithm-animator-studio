import type { AppLocale } from "@/constants/locale";
import { ITEM_STATUS_LABEL_KEYS } from "@/constants/domainPrimitives";
import type { ItemStatus } from "@/types/domainPrimitives";
import { buildDomainLabels } from "@/utils/domainLabels";

export const ITEM_STATUS_LABELS: Record<AppLocale, Record<ItemStatus, string>> = {
  vi: buildDomainLabels("vi", ITEM_STATUS_LABEL_KEYS),
  en: buildDomainLabels("en", ITEM_STATUS_LABEL_KEYS),
};

export function isManagerPlusRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return role === "owner_admin" || role === "manager";
}
