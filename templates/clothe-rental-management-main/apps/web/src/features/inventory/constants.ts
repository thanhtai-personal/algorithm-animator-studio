import { ITEM_STATUS_VALUES } from "@/constants/domainPrimitives";
import type { ItemStatus } from "@/types/domainPrimitives";

export const INVENTORY_FEATURE_KEY = "inventory";
export const INVENTORY_DEFAULT_PAGE_SIZE = 20;
export const INVENTORY_MAX_PAGE_SIZE = 80;
export const INVENTORY_SCAN_MAX_RESULT = 25;
export const INVENTORY_STATUS_VALUES: ItemStatus[] = [...ITEM_STATUS_VALUES];
