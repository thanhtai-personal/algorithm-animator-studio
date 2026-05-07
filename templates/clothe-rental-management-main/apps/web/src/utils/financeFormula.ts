import type { AppLocale } from "@/constants/locale";

const FINANCIAL_FORMULA_VERSION_LABELS: Record<string, Record<AppLocale, string>> = {
  FINANCE_V1_PAYMENT_POSTED_COGS: {
    vi: "Phiên bản tài chính V1 (ghi nhận payment POSTED và giá vốn hàng bán)",
    en: "Finance formula V1 (posted payments and cost of goods sold recognition)",
  },
};

export function resolveFinancialFormulaVersionLabel(
  formulaVersion: string | null | undefined,
  locale: AppLocale
): string {
  const normalized = formulaVersion?.trim();
  if (!normalized) {
    return locale === "vi" ? "Công thức tài chính" : "Financial formula";
  }

  return (
    FINANCIAL_FORMULA_VERSION_LABELS[normalized]?.[locale] ??
    (locale === "vi" ? "Công thức tài chính tùy chỉnh" : "Custom financial formula")
  );
}
