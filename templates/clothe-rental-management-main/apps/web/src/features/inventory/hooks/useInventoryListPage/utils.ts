import type { AddItemDraft, InventoryListCopy } from "./types";

export function buildInitialAddItemDraft(): AddItemDraft {
  return {
    productId: "",
    itemCodesText: "",
    initialStatus: "READY",
    itemSize: "",
  };
}

export function resolveAddItemErrorMessage(options: {
  error: unknown;
  copy: InventoryListCopy;
  fallback: string;
}): string {
  if (!(options.error instanceof Error)) return options.fallback;

  if (
    options.error.message === "DUPLICATE_ITEM_CODE" ||
    options.error.message === "DUPLICATE_ITEM_CODE_IN_PAYLOAD"
  ) {
    return options.copy.addItemDuplicateCodeExistsError;
  }

  if (options.error.message === "FORBIDDEN_MANAGER_ONLY_ITEM_STATUS") {
    return options.copy.addItemForbiddenSoldError;
  }

  if (options.error.message === "Invalid product items payload") {
    return options.copy.addItemInvalidPayloadError;
  }

  return options.error.message || options.fallback;
}
