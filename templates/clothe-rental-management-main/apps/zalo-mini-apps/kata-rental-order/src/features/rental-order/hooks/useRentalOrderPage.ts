import { useDeferredValue, useEffect, useState } from "react";
import { rentalOrderStore, type SelectedRentalItem } from "@/features/rental-order/stores/rentalOrderStore";
import {
  useCreateRentalOrderMutation,
  useCreateRentalPosManualPaymentMutation,
  useCreateRentalCustomerMutation,
  useCreateReturnOrderMutation,
  useOrderStatusTransitionMutation,
  useRentalActiveOrdersQuery,
  useRentalCustomersQuery,
  useRentalOrderAccessQuery,
  useRentalOrderDetailQuery,
  useRentalProductsQuery,
} from "@/features/rental-order/queries/useRentalOrderQueries";
import { zaloMiniAppAuthStore } from "@/features/auth/stores/zaloMiniAppAuthStore";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { useVoiceDictationPrimitive } from "@/lib/voice/useVoiceDictationPrimitive";
import type {
  CreateRentalOrderPayload,
  ProductSummaryDto,
  RentalOrderType,
} from "@/lib/contracts";

type QuickFillField =
  | "customerSearch"
  | "startDate"
  | "endDate"
  | "pickupTime"
  | "returnTime"
  | "depositAmount"
  | "collectedAmount"
  | "note"
  | "receiptMethod";

const QUICK_FILL_FIELD_ALIASES: Array<{ field: QuickFillField; aliases: string[] }> = [
  {
    field: "customerSearch",
    aliases: ["khach hang", "ten khach", "ten khach hang", "khach"],
  },
  { field: "startDate", aliases: ["ngay bat dau", "bat dau", "tu ngay"] },
  { field: "endDate", aliases: ["ngay ket thuc", "ket thuc", "den ngay"] },
  { field: "pickupTime", aliases: ["gio nhan do", "gio nhan", "nhan do"] },
  { field: "returnTime", aliases: ["gio tra do", "gio tra", "tra do"] },
  { field: "depositAmount", aliases: ["tien coc", "coc"] },
  {
    field: "collectedAmount",
    aliases: [
      "tien thue",
      "gia thue",
      "gia ban",
      "tong gia ban",
      "tong tien ban",
      "thu ngay",
      "tien thu",
      "da thu",
      "thu tien",
    ],
  },
  { field: "receiptMethod", aliases: ["phuong thuc thu tien", "phuong thuc", "hinh thuc"] },
  { field: "note", aliases: ["ghi chu", "note"] },
];

const AMOUNT_UNIT_PATTERNS: Array<{ regex: RegExp; multiplier: number }> = [
  { regex: /(\d+(?:[.,]\d+)?)\s*(?:ty)\b/i, multiplier: 1_000_000_000 },
  { regex: /(\d+(?:[.,]\d+)?)\s*(?:trieu)\b/i, multiplier: 1_000_000 },
  { regex: /(\d+(?:[.,]\d+)?)\s*tr\b/i, multiplier: 1_000_000 },
  { regex: /(\d+(?:[.,]\d+)?)\s*(?:nghin|ngan)\b/i, multiplier: 1_000 },
  { regex: /(\d+(?:[.,]\d+)?)\s*k\b/i, multiplier: 1_000 },
];

const VALUE_DECORATOR_TOKENS = new Set(["la", "bang", "lai"]);

function parseFlexibleNumber(rawValue: string): number | null {
  const normalized = rawValue.trim().replace(/\s+/g, "");
  if (!normalized) return null;

  let numericCandidate = normalized;
  if (numericCandidate.includes(",") && numericCandidate.includes(".")) {
    numericCandidate = numericCandidate.replace(/\./g, "").replace(/,/g, ".");
  } else if (numericCandidate.split(".").length > 2) {
    numericCandidate = numericCandidate.replace(/\./g, "");
  } else if (numericCandidate.split(",").length > 2) {
    numericCandidate = numericCandidate.replace(/,/g, "");
  } else {
    numericCandidate = numericCandidate.replace(/,/g, ".");
  }

  const parsed = Number.parseFloat(numericCandidate);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseAmountTranscript(transcript: string): string | null {
  const normalized = normalizePatternText(transcript);
  const matches = Array.from(
    normalized.matchAll(/(\d+(?:[.,]\d+)?)\s*(ty|trieu|tr|nghin|ngan|k)\b/gi)
  );
  if (matches.length > 0) {
    let sum = 0;
    for (const match of matches) {
      const amountRaw = match[1];
      const unit = match[2]?.toLowerCase() ?? "";
      const base = parseFlexibleNumber(amountRaw);
      if (base === null || base <= 0) continue;

      const multiplier =
        unit === "ty"
          ? 1_000_000_000
          : unit === "trieu" || unit === "tr"
            ? 1_000_000
            : 1_000;
      sum += Math.round(base * multiplier);
    }
    if (sum > 0) return String(sum);
  }

  for (const pattern of AMOUNT_UNIT_PATTERNS) {
    const match = normalized.match(pattern.regex);
    if (!match?.[1]) continue;
    const base = parseFlexibleNumber(match[1]);
    if (base === null || base <= 0) continue;
    return String(Math.round(base * pattern.multiplier));
  }

  const digits = transcript.replace(/[^\d]/g, "");
  return digits || null;
}

function hasNumericChar(value: string): boolean {
  return /\d/.test(value);
}

function formatIsoDate(year: number, month: number, day: number): string | null {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  const date = new Date(year, month - 1, day);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function shiftDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDateTranscript(transcript: string): string | null {
  const normalized = transcript.trim();
  const normalizedText = normalizePatternText(transcript);

  if (["hom nay", "ngay hom nay"].some((entry) => normalizedText === entry)) {
    return shiftDate(0);
  }
  if (["ngay mai", "mai"].some((entry) => normalizedText === entry)) {
    return shiftDate(1);
  }
  if (["ngay mot", "mot"].some((entry) => normalizedText === entry)) {
    return shiftDate(2);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const [year, month, day] = normalized.split("-").map((value) => Number(value));
    return formatIsoDate(year, month, day);
  }

  const dayMonthYearMatch = normalized.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (dayMonthYearMatch) {
    const [, day, month, year] = dayMonthYearMatch.map((value) => Number(value));
    return formatIsoDate(year, month, day);
  }

  const dayMonthMatch = normalized.match(/^(\d{1,2})[./-](\d{1,2})$/);
  if (dayMonthMatch) {
    const [, day, month] = dayMonthMatch.map((value) => Number(value));
    return formatIsoDate(new Date().getFullYear(), month, day);
  }

  const inlineDateMatch = normalizedText.match(/(\d{1,2})[./-](\d{1,2})(?:[./-](\d{4}))?/);
  if (inlineDateMatch) {
    const day = Number(inlineDateMatch[1]);
    const month = Number(inlineDateMatch[2]);
    const year = inlineDateMatch[3] ? Number(inlineDateMatch[3]) : new Date().getFullYear();
    return formatIsoDate(year, month, day);
  }

  const naturalDateMatch = normalizedText.match(
    /^(?:ngay\s*)?(\d{1,2})\s*thang\s*(\d{1,2})(?:\s*nam\s*(\d{4}))?$/
  );
  if (naturalDateMatch) {
    const [, dayRaw, monthRaw, yearRaw] = naturalDateMatch;
    const day = Number(dayRaw);
    const month = Number(monthRaw);
    const year = yearRaw ? Number(yearRaw) : new Date().getFullYear();
    return formatIsoDate(year, month, day);
  }

  return null;
}

function formatIsoTime(hour: number, minute: number): string | null {
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function applyMeridiem(hour: number, meridiem: "am" | "pm" | null): number {
  if (meridiem === "pm" && hour < 12) return hour + 12;
  if (meridiem === "am" && hour === 12) return 0;
  return hour;
}

function parseTimeTranscript(transcript: string): string | null {
  const normalized = transcript.trim();
  const normalizedText = normalizePatternText(transcript);
  const hasPmHint = ["chieu", "toi", "dem", "pm", "buoi chieu", "buoi toi"].some((entry) =>
    normalizedText.includes(entry)
  );
  const hasAmHint = ["sang", "am", "buoi sang"].some((entry) => normalizedText.includes(entry));
  const meridiem: "am" | "pm" | null = hasPmHint ? "pm" : hasAmHint ? "am" : null;
  const coreText = normalizedText
    .replace(/\bbuoi\s+(?:sang|chieu|toi)\b/g, " ")
    .replace(/\b(?:sang|chieu|toi|dem|am|pm)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const hhmmMatch = normalized.match(/^(\d{1,2}):(\d{1,2})$/);
  if (hhmmMatch) {
    const hour = applyMeridiem(Number(hhmmMatch[1]), meridiem);
    const minute = Number(hhmmMatch[2]);
    return formatIsoTime(hour, minute);
  }

  const compactHMatch = coreText.match(/^(\d{1,2})h(\d{1,2})?$/);
  if (compactHMatch) {
    const hour = applyMeridiem(Number(compactHMatch[1]), meridiem);
    const minute = Number(compactHMatch[2] ?? 0);
    return formatIsoTime(hour, minute);
  }

  const spokenHourMatch = coreText.match(/^(\d{1,2})\s*gio(?:\s*(\d{1,2}))?(?:\s*phut)?$/);
  if (spokenHourMatch) {
    const hour = applyMeridiem(Number(spokenHourMatch[1]), meridiem);
    const minute = Number(spokenHourMatch[2] ?? 0);
    return formatIsoTime(hour, minute);
  }

  const hourOnlyMatch = coreText.match(/^(\d{1,2})$/);
  if (hourOnlyMatch) {
    const hour = applyMeridiem(Number(hourOnlyMatch[1]), meridiem);
    return formatIsoTime(hour, 0);
  }

  return null;
}

function normalizeSpeechToken(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function normalizePatternText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildKeywordMatcher(text: string) {
  const normalizedText = normalizePatternText(text);
  const textTokens = normalizedText.split(/\s+/).filter(Boolean);
  const textTokenSet = new Set(textTokens);

  const matchesKeyword = (keyword: string) => {
    const keywordTokens = normalizePatternText(keyword).split(/\s+/).filter(Boolean);
    if (keywordTokens.length === 0) return false;

    if (keywordTokens.length === 1) {
      return textTokenSet.has(keywordTokens[0]);
    }

    for (let index = 0; index <= textTokens.length - keywordTokens.length; index += 1) {
      let isMatch = true;
      for (let aliasIndex = 0; aliasIndex < keywordTokens.length; aliasIndex += 1) {
        if (textTokens[index + aliasIndex] !== keywordTokens[aliasIndex]) {
          isMatch = false;
          break;
        }
      }
      if (isMatch) return true;
    }

    return false;
  };

  return { matchesKeyword };
}

function trimValueFromTokens(tokens: string[]): string {
  let start = 0;
  while (start < tokens.length) {
    const rawToken = tokens[start];
    const normalizedToken = normalizeSpeechToken(rawToken);
    if (
      rawToken.match(/^[:\-–—,.=]+$/) ||
      VALUE_DECORATOR_TOKENS.has(normalizedToken) ||
      !normalizedToken
    ) {
      start += 1;
      continue;
    }
    break;
  }

  return tokens
    .slice(start)
    .join(" ")
    .replace(/^[:\-–—,.=\s]+/, "")
    .replace(/[:\-–—,.=\s]+$/, "")
    .trim();
}

function parseQuickFillCommand(
  transcript: string
): {
  field: QuickFillField;
  value: string;
} | null {
  const rawTokens = transcript
    .trim()
    .split(/\s+/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  if (rawTokens.length === 0) return null;

  const tokenEntries = rawTokens
    .map((rawToken) => ({
      raw: rawToken,
      normalized: normalizeSpeechToken(rawToken),
    }))
    .filter((entry) => entry.normalized.length > 0);

  if (tokenEntries.length === 0) return null;

  const normalizedTokens = tokenEntries.map((entry) => entry.normalized);
  let bestMatch:
    | {
        field: QuickFillField;
        startIndex: number;
        endIndex: number;
        aliasTokenLength: number;
      }
    | null = null;

  for (const entry of QUICK_FILL_FIELD_ALIASES) {
    for (const alias of entry.aliases) {
      const aliasTokens = alias
        .split(/\s+/)
        .map((token) => normalizeSpeechToken(token))
        .filter((token) => token.length > 0);
      if (aliasTokens.length === 0 || aliasTokens.length > normalizedTokens.length) continue;

      for (let startIndex = 0; startIndex <= normalizedTokens.length - aliasTokens.length; startIndex += 1) {
        let isMatch = true;
        for (let aliasIndex = 0; aliasIndex < aliasTokens.length; aliasIndex += 1) {
          if (normalizedTokens[startIndex + aliasIndex] !== aliasTokens[aliasIndex]) {
            isMatch = false;
            break;
          }
        }
        if (!isMatch) continue;

        const nextMatch = {
          field: entry.field,
          startIndex,
          endIndex: startIndex + aliasTokens.length - 1,
          aliasTokenLength: aliasTokens.length,
        };
        if (
          !bestMatch ||
          nextMatch.aliasTokenLength > bestMatch.aliasTokenLength ||
          (nextMatch.aliasTokenLength === bestMatch.aliasTokenLength &&
            nextMatch.startIndex < bestMatch.startIndex)
        ) {
          bestMatch = nextMatch;
        }
      }
    }
  }

  if (!bestMatch) return null;

  const afterTokens = tokenEntries.slice(bestMatch.endIndex + 1).map((entry) => entry.raw);
  const beforeTokens = tokenEntries.slice(0, bestMatch.startIndex).map((entry) => entry.raw);
  const parsedValue = trimValueFromTokens(afterTokens) || trimValueFromTokens(beforeTokens);
  if (!parsedValue) return null;

  return {
    field: bestMatch.field,
    value: parsedValue,
  };
}

function parseReceiptMethodTranscript(
  transcript: string
): "CASH" | "BANK" | "MOMO" | null {
  const { matchesKeyword } = buildKeywordMatcher(transcript);

  if (["momo", "vi momo"].some(matchesKeyword)) {
    return "MOMO";
  }

  if (["chuyen khoan", "bank", "ck"].some(matchesKeyword)) {
    return "BANK";
  }

  if (["tien mat", "cash", "tm"].some(matchesKeyword)) {
    return "CASH";
  }

  return null;
}

function parsePositiveMoney(value: string): number {
  const parsed = Number(value.trim().replace(/[^\d.]/g, ""));
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return parsed;
}

function buildSelectedItem(
  product: ProductSummaryDto,
  item: NonNullable<ProductSummaryDto["readyItemsDetail"]>[number],
  orderType: RentalOrderType,
  pricingMode: "STANDARD" | "QUICK"
): SelectedRentalItem {
  const pricePlan = {
    price1d: item.price1d ?? product.pricePolicy.price1d ?? product.rentPricePerDay,
    pricePerDay: item.pricePerDay ?? product.pricePolicy.pricePerDay ?? product.rentPricePerDay,
    defaultDepositAmount:
      item.defaultDepositAmount ??
      product.rentDepositAmount ??
      product.pricePolicy.defaultDepositAmount,
  };
  const defaultRentPrice =
    orderType === "SALE"
      ? product.salePrice ?? 0
      : pricePlan.price1d ??
        pricePlan.pricePerDay ??
        product.rentPricePerDay ??
        0;
  const quickRentPrice = product.quickRentPrice ?? defaultRentPrice;
  const resolvedRentPrice =
    orderType === "SALE"
      ? defaultRentPrice
      : pricingMode === "QUICK"
        ? quickRentPrice
        : defaultRentPrice;

  return {
    itemId: item.id,
    itemCode: item.itemCode,
    productId: product.id,
    productName: product.name,
    productCode: product.productCode,
    variantId: item.variantId,
    variantName: item.variantName,
    coverImagePath: product.coverImagePath,
    rentPrice: resolvedRentPrice,
    unitPrice: defaultRentPrice,
    quickUnitPrice: quickRentPrice,
    depositAmount: pricePlan.defaultDepositAmount ?? 0,
    salePrice: product.salePrice ?? 0,
    maxQuantity: product.readyItems,
  };
}

function findNextReadyItem(
  product: ProductSummaryDto,
  selectedItems: SelectedRentalItem[]
): NonNullable<ProductSummaryDto["readyItemsDetail"]>[number] | null {
  const selectedIds = new Set(selectedItems.map((entry) => entry.itemId));
  const readyItems = product.readyItemsDetail ?? [];
  return readyItems.find((entry) => !selectedIds.has(entry.id)) ?? null;
}

export interface RentalOrderCartProduct {
  productId: string;
  productCode: string;
  productName: string;
  coverImagePath: string | null;
  variantNames: string[];
  quantity: number;
  maxQuantity: number;
  unitPrice: number;
  depositAmount: number;
  lineTotal: number;
}

export function useRentalOrderPage() {
  const accessToken = zaloMiniAppAuthStore.accessToken;
  const store = rentalOrderStore;
  const [quickVoiceHint, setQuickVoiceHint] = useState<string | null>(null);

  const customerSearch = useDeferredValue(store.customerSearch.trim());
  const productSearch = useDebouncedValue(store.productSearch.trim(), 350);
  const activeOrdersSearch = store.activeOrdersSearch.trim();
  const [activeOrdersPage, setActiveOrdersPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    setActiveOrdersPage(1);
    setSelectedOrderId(null);
  }, [activeOrdersSearch, store.branchId]);

  useEffect(() => {
    setSelectedOrderId(null);
  }, [activeOrdersPage]);

  const accessQuery = useRentalOrderAccessQuery(accessToken);
  const customersQuery = useRentalCustomersQuery(accessToken, store.branchId, customerSearch);
  const productsQuery = useRentalProductsQuery(accessToken, store.branchId, productSearch);
  const activeOrdersQuery = useRentalActiveOrdersQuery(
    accessToken,
    store.branchId,
    activeOrdersSearch,
    activeOrdersPage
  );
  const activeOrderDetailQuery = useRentalOrderDetailQuery(accessToken, selectedOrderId);
  const createOrderMutation = useCreateRentalOrderMutation(accessToken);
  const createManualPaymentMutation = useCreateRentalPosManualPaymentMutation(accessToken);
  const createCustomerMutation = useCreateRentalCustomerMutation(accessToken);
  const createReturnOrderMutation = useCreateReturnOrderMutation(accessToken);
  const orderStatusTransitionMutation = useOrderStatusTransitionMutation(accessToken);

  const cartProducts = store.selectedItems.reduce<RentalOrderCartProduct[]>((groups, item) => {
    const existing = groups.find((entry) => entry.productId === item.productId);
    if (!existing) {
      groups.push({
        productId: item.productId,
        productCode: item.productCode,
        productName: item.productName,
        coverImagePath: item.coverImagePath,
        variantNames: item.variantName ? [item.variantName] : [],
        quantity: 1,
        maxQuantity: item.maxQuantity,
        unitPrice: store.orderType === "SALE" ? item.salePrice : item.unitPrice,
        depositAmount: item.depositAmount,
        lineTotal: store.orderType === "SALE" ? item.salePrice : item.rentPrice,
      });
      return groups;
    }

    existing.quantity += 1;
    existing.lineTotal += store.orderType === "SALE" ? item.salePrice : item.rentPrice;
    if (item.variantName && !existing.variantNames.includes(item.variantName)) {
      existing.variantNames.push(item.variantName);
    }
    return groups;
  }, []);

  const subtotalAmount = store.selectedItems.reduce((sum, item) => {
    return sum + (store.orderType === "SALE" ? item.salePrice : item.rentPrice);
  }, 0);

  const suggestedDepositAmount = store.selectedItems.reduce((sum, item) => {
    return sum + item.depositAmount;
  }, 0);

  const trimmedCustomerSearch = store.customerSearch.trim();
  const canQuickCreateCustomer =
    store.branchId !== null &&
    trimmedCustomerSearch.length >= 2 &&
    hasNumericChar(trimmedCustomerSearch) &&
    !customersQuery.isFetching &&
    store.customerResults.length === 0;

  const handleQuickVoiceTranscript = (transcript: string) => {
    const parsed = parseQuickFillCommand(transcript);
    if (!parsed) {
      setQuickVoiceHint("Không nhận diện được field. Hãy đọc theo mẫu: tên field + nội dung.");
      return;
    }

    const { field, value } = parsed;
    switch (field) {
      case "customerSearch":
        store.setCustomerSearch(value);
        setQuickVoiceHint(null);
        return;
      case "note":
        store.setNote(value);
        setQuickVoiceHint(null);
        return;
      case "receiptMethod": {
        const parsedMethod = parseReceiptMethodTranscript(value);
        if (!parsedMethod) {
          setQuickVoiceHint("Không nhận diện được phương thức thu tiền.");
          return;
        }
        store.setReceiptMethod(parsedMethod);
        setQuickVoiceHint(null);
        return;
      }
      case "startDate": {
        const parsedDate = parseDateTranscript(value);
        if (!parsedDate) {
          setQuickVoiceHint("Không nhận diện được ngày bắt đầu.");
          return;
        }
        store.setStartDate(parsedDate, { preserveSelection: true });
        setQuickVoiceHint(null);
        return;
      }
      case "endDate": {
        const parsedDate = parseDateTranscript(value);
        if (!parsedDate) {
          setQuickVoiceHint("Không nhận diện được ngày kết thúc.");
          return;
        }
        store.setEndDate(parsedDate, { preserveSelection: true });
        setQuickVoiceHint(null);
        return;
      }
      case "pickupTime": {
        const parsedTime = parseTimeTranscript(value);
        if (!parsedTime) {
          setQuickVoiceHint("Không nhận diện được giờ nhận đồ.");
          return;
        }
        store.setPickupTime(parsedTime);
        setQuickVoiceHint(null);
        return;
      }
      case "returnTime": {
        const parsedTime = parseTimeTranscript(value);
        if (!parsedTime) {
          setQuickVoiceHint("Không nhận diện được giờ trả đồ.");
          return;
        }
        store.setReturnTime(parsedTime);
        setQuickVoiceHint(null);
        return;
      }
      case "depositAmount": {
        const parsedAmount = parseAmountTranscript(value);
        if (!parsedAmount) {
          setQuickVoiceHint("Không nhận diện được tiền cọc.");
          return;
        }
        store.setDepositAmount(parsedAmount);
        setQuickVoiceHint(null);
        return;
      }
      case "collectedAmount": {
        const parsedAmount = parseAmountTranscript(value);
        if (!parsedAmount) {
          setQuickVoiceHint("Không nhận diện được số tiền giá bán/thu ngay.");
          return;
        }
        store.setCollectedAmount(parsedAmount);
        setQuickVoiceHint(null);
        return;
      }
      default:
        setQuickVoiceHint("Không nhận diện được field cần cập nhật.");
        return;
    }
  };

  const quickVoice = useVoiceDictationPrimitive({
    language: "vi-VN",
    disabled: !store.branchId || store.currentStep !== 2,
    onResult: handleQuickVoiceTranscript,
  });

  useEffect(() => {
    if (quickVoice.state !== "listening") return;
    setQuickVoiceHint(null);
  }, [quickVoice.state]);

  const addProductToCart = (product: ProductSummaryDto) => {
    const selectedItems = store.selectedItems.filter((entry) => entry.productId === product.id);
    const nextItem = findNextReadyItem(product, selectedItems);
    if (!nextItem) return;

    store.toggleSelectedItem(
      buildSelectedItem(product, nextItem, store.orderType, store.pricingMode)
    );
  };

  const increaseProductQuantity = (productId: string) => {
    const product = store.productResults.find((entry) => entry.id === productId);
    if (!product) return;

    const selectedItems = store.selectedItems.filter((entry) => entry.productId === productId);
    const nextItem = findNextReadyItem(product, selectedItems);
    if (!nextItem) return;

    store.toggleSelectedItem(
      buildSelectedItem(product, nextItem, store.orderType, store.pricingMode)
    );
  };

  const decreaseProductQuantity = (productId: string) => {
    store.removeLastSelectedItemForProduct(productId);
  };

  const removeProductFromCart = (productId: string) => {
    store.clearSelectedProduct(productId);
  };

  useEffect(() => {
    if (store.orderType === "SALE") {
      store.syncSuggestedDepositAmount(0);
      return;
    }

    store.syncSuggestedDepositAmount(suggestedDepositAmount);
  }, [store, store.orderType, suggestedDepositAmount]);

  useEffect(() => {
    store.syncSuggestedCollectedAmount(subtotalAmount);
  }, [store, subtotalAmount]);

  const goToCustomerStep = () => {
    if (!store.canProceedToCustomerStep) return;
    store.setCurrentStep(2);
  };

  const goToProductsStep = () => {
    quickVoice.abort();
    store.setCurrentStep(1);
  };

  const createQuickCustomer = async () => {
    if (!accessToken || !store.branchId) return;

    await createCustomerMutation.mutateAsync({
      branchId: store.branchId,
      fullName: store.quickCustomerFullName.trim(),
      phone: store.quickCustomerPhone.trim(),
    });
  };

  const submit = async () => {
    if (!accessToken || !store.branchId || store.selectedItems.length === 0) {
      return;
    }

    if (store.orderType === "RENTAL" && !store.selectedCustomer) {
      return;
    }

    const collectedAmountRaw = Number(store.collectedAmount || 0);
    const depositAmountRaw = Number(store.depositAmount || 0);
    const collectedAmount = Number.isFinite(collectedAmountRaw)
      ? Math.max(0, collectedAmountRaw)
      : 0;
    const depositAmount = Number.isFinite(depositAmountRaw)
      ? Math.max(0, depositAmountRaw)
      : 0;
    const createPayments: NonNullable<CreateRentalOrderPayload["payments"]> = [];

    if (store.orderType === "RENTAL" && depositAmount > 0) {
      createPayments.push({
        type: "DEPOSIT",
        method: store.receiptMethod,
        amount: depositAmount,
        status: "POSTED",
        source: "zalo-mini-app",
      });
    }

    if (collectedAmount > 0) {
      createPayments.push({
        type: "RENT",
        method: store.receiptMethod,
        amount: collectedAmount,
        status: "POSTED",
        source: "zalo-mini-app",
      });
    }

    const totalCollectedOnCreate = createPayments.reduce((sum, payment) => {
      if (payment.status !== "POSTED") return sum;
      return sum + payment.amount;
    }, 0);

    const payload: CreateRentalOrderPayload = {
      branchId: store.branchId,
      orderType: store.orderType,
      pricingMode: store.orderType === "RENTAL" ? store.pricingMode : null,
      status: "CONFIRMED",
      customerId: store.selectedCustomer?.id ?? "",
      startDate: store.startDate,
      endDate: store.endDate,
      pickupTime: store.orderType === "SALE" ? null : store.pickupTime,
      returnTime: store.orderType === "SALE" ? null : store.returnTime,
      depositAmount,
      note: store.note || null,
      items: store.selectedItems.map((item) => ({
        itemId: item.itemId,
        rentPlanType:
          store.orderType === "SALE"
            ? undefined
            : store.pricingMode === "QUICK"
              ? "1d"
              : "3d",
        rentPlanDays:
          store.orderType === "SALE"
            ? undefined
            : store.pricingMode === "QUICK"
              ? 1
              : 3,
        rentPrice: store.orderType === "SALE" ? item.salePrice : item.rentPrice,
        depositOverrideAmount: store.orderType === "SALE" ? undefined : item.depositAmount,
      })),
      payments: createPayments.length > 0 ? createPayments : undefined,
      paymentReceiptConfirmation:
        totalCollectedOnCreate > 0
          ? {
              confirmed: true,
              amount: totalCollectedOnCreate,
              method: store.receiptMethod,
              note: "Mini app receipt reviewed by staff",
            }
          : null,
    };

    store.setCreateOrderSuccess(null);
    const response = await createOrderMutation.mutateAsync(payload);
    const summary = response.order?.summary;

    quickVoice.abort();
    store.resetDraftKeepingAccess();
    if (summary) {
      const orderLabel = summary.orderType === "SALE" ? "đơn bán" : "đơn thuê";
      store.setCreateOrderSuccess({
        message: `Tạo ${orderLabel} thành công.`,
        summary,
      });
    } else {
      store.setCreateOrderSuccess({
        message: "Tạo đơn thành công.",
        summary: null,
      });
    }
  };

  const submitManualPayment = async (): Promise<string | null> => {
    if (!accessToken || !store.branchId) {
      return "Thiếu ngữ cảnh chi nhánh.";
    }

    const amount = parsePositiveMoney(store.manualPaymentAmount);
    if (amount <= 0) {
      return "Số tiền phải lớn hơn 0.";
    }

    const reason = store.manualPaymentReason.trim();
    if (!reason) {
      return "Lý do là bắt buộc.";
    }

    const payment = await createManualPaymentMutation.mutateAsync({
      branchId: store.branchId,
      type: store.manualPaymentType,
      method: store.manualPaymentMethod,
      amount,
      reason,
      note: store.manualPaymentNote.trim() || undefined,
      isImportOrder:
        store.manualPaymentType === "EXPENSE"
          ? store.manualPaymentIsImportOrder
          : false,
      isInitialCapital: store.manualPaymentIsInitialCapital,
    });

    store.setLatestManualPayment(payment);
    store.resetManualPaymentDraft();
    return null;
  };

  useEffect(() => {
    if (store.currentStep === 2) return;
    quickVoice.abort();
    setQuickVoiceHint(null);
  }, [quickVoice, store.currentStep]);

  return {
    store,
    accessQuery,
    activeOrdersQuery,
    activeOrdersSearch,
    createOrderMutation,
    createManualPaymentMutation,
    createReturnOrderMutation,
    cartProducts,
    subtotalAmount,
    suggestedDepositAmount,
    customersQuery,
    productsQuery,
    createCustomerMutation,
    orderStatusTransitionMutation,
    canQuickCreateCustomer,
    addProductToCart,
    increaseProductQuantity,
    decreaseProductQuantity,
    removeProductFromCart,
    goToCustomerStep,
    goToProductsStep,
    createQuickCustomer,
    setActiveOrdersSearch: store.setActiveOrdersSearch,
    activeOrdersPage,
    setActiveOrdersPage,
    quickVoice,
    quickVoiceHint,
    submit,
    submitManualPayment,
    selectedOrderId,
    setSelectedOrderId,
    activeOrderDetailQuery,
  };
}

export type UseRentalOrderPageResult = ReturnType<typeof useRentalOrderPage>;
