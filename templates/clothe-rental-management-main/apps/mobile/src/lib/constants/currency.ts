export type SupportedCurrency = "VND" | "USD" | "CNY" | "KRW" | "JPY" | "INR";

export interface CurrencyOption {
  code: SupportedCurrency;
  name: string;
  symbol: string;
  locale: string;
  flag: string;
}

export const currencyOptions: CurrencyOption[] = [
  { code: "VND", name: "Vietnamese Dong", symbol: "₫", locale: "vi-VN", flag: "🇻🇳" },
  { code: "USD", name: "US Dollar", symbol: "$", locale: "en-US", flag: "🇺🇸" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", locale: "zh-CN", flag: "🇨🇳" },
  { code: "KRW", name: "Korean Won", symbol: "₩", locale: "ko-KR", flag: "🇰🇷" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", locale: "ja-JP", flag: "🇯🇵" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", locale: "hi-IN", flag: "🇮🇳" },
];
