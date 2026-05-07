import { convertUSD, formatPrice as formatPriceWithLocale } from "@/lib/exchangeRate";

export function formatPrice(usdPrice: number, currency: string, rates: Record<string, number>, localeCode: string) {
  const amount = currency === "USD" ? usdPrice : convertUSD(usdPrice, currency, rates);
  return formatPriceWithLocale(amount, currency, localeCode);
}
