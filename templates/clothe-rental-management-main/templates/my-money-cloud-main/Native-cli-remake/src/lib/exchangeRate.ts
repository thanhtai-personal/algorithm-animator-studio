/**
 * Exchange Rate API Integration
 * API: https://apilayer.com/exchangerates_data
 */
import storageAdapter from "@/lib/storageAdapter";

const EXCHANGE_RATE_API_BASE_URL = "https://api.apilayer.com/exchangerates_data";
const CACHE_KEY = "spendsmart:exchange-rates";
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours
let serverCache: CachedRates | null = null;
const inFlight = new Map<string, Promise<Record<string, number>>>();

interface ExchangeRateResponse {
  success: boolean;
  timestamp: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

interface CachedRates {
  rates: Record<string, number>;
  timestamp: number;
}

interface ExchangeRateResult {
  rates: Record<string, number>;
  shouldCache: boolean;
}

/**
 * Fetch exchange rates from API
 */
async function fetchExchangeRates(
  base: string = "USD",
  symbols: string[] = ["VND", "KRW", "CNY", "JPY", "INR"]
): Promise<ExchangeRateResult> {
  const apiKey =
    process.env.EXPO_PUBLIC_EXCHANGE_RATE_API_KEY ||
    process.env.EXCHANGE_RATE_API_KEY ||
    process.env.EXCHANGE_RATE_API_KEY;
  
  if (!apiKey) {
    return { rates: getFallbackRates(), shouldCache: false };
  }

  try {
    const symbolsParam = symbols.join(",");
    const url = `${EXCHANGE_RATE_API_BASE_URL}/latest?base=${base}&symbols=${symbolsParam}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        apikey: apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data: ExchangeRateResponse = await response.json();

    if (!data.success) {
      throw new Error("API returned unsuccessful response");
    }

    return { rates: data.rates, shouldCache: true };
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    return { rates: getFallbackRates(), shouldCache: false };
  }
}

/**
 * Get exchange rates with caching (1 hour)
 */
export async function getExchangeRates(
  base: string = "USD",
  symbols: string[] = ["VND", "KRW", "CNY", "JPY", "INR"]
): Promise<Record<string, number>> {
  const cacheKey = `${base}|${symbols.slice().sort().join(",")}`;

  // Server-side (Node): cache in memory to avoid hitting the API more than once per 24h
  const isServer = typeof process !== "undefined" && process.release?.name === "node";
  if (isServer) {
    const now = Date.now();
    if (serverCache && now - serverCache.timestamp < CACHE_DURATION) {
      return serverCache.rates;
    }
    const existing = inFlight.get(cacheKey);
    if (existing) return existing;

    const fetchPromise = (async () => {
      const { rates, shouldCache } = await fetchExchangeRates(base, symbols);
      if (shouldCache) {
        serverCache = { rates, timestamp: Date.now() };
      }
      return rates;
    })();

    inFlight.set(cacheKey, fetchPromise);
    try {
      return await fetchPromise;
    } finally {
      inFlight.delete(cacheKey);
    }
  }

  // Client-side: check cache first
  const cached = storageAdapter.getItem(CACHE_KEY);
  if (cached) {
    try {
      const cachedData: CachedRates = JSON.parse(cached);
      const now = Date.now();
      if (now - cachedData.timestamp < CACHE_DURATION) {
        return cachedData.rates;
      }
    } catch (error) {
      console.error("Error reading cache:", error);
    }
  }

  // De-duplicate concurrent client fetches (e.g., React Strict Mode double render)
  const existing = inFlight.get(cacheKey);
  if (existing) return existing;

  const fetchPromise = (async () => {
    const { rates, shouldCache } = await fetchExchangeRates(base, symbols);

    // Cache the results
    if (shouldCache) {
      try {
        const cacheData: CachedRates = {
          rates,
          timestamp: Date.now(),
        };
        storageAdapter.setItem(CACHE_KEY, JSON.stringify(cacheData));
      } catch (error) {
        console.error("Error caching rates:", error);
      }
    }

    return rates;
  })();

  inFlight.set(cacheKey, fetchPromise);
  try {
    return await fetchPromise;
  } finally {
    inFlight.delete(cacheKey);
  }
}

/**
 * Convert USD to target currency
 */
export function convertUSD(
  usdAmount: number,
  targetCurrency: string,
  rates: Record<string, number>
): number {
  const rate = rates[targetCurrency];
  if (!rate) {
    const fallback = getFallbackRates();
    const fallbackRate = fallback[targetCurrency];
    if (!fallbackRate) {
      console.warn(`Rate not found for ${targetCurrency}, using fallback`);
      return usdAmount;
    }
    return usdAmount * fallbackRate;
  }
  return usdAmount * rate;
}

/**
 * Fallback exchange rates (approximate, as of Jan 2026)
 */
function getFallbackRates(): Record<string, number> {
  return {
    VND: 25000, // 1 USD = 25,000 VND
    KRW: 1250, // 1 USD = 1,250 KRW
    CNY: 7.2, // 1 USD = 7.2 CNY
    JPY: 150, // 1 USD = 150 JPY
    INR: 83, // 1 USD = 83 INR
    EUR: 0.92, // 1 USD = 0.92 EUR
    GBP: 0.79, // 1 USD = 0.79 GBP
  };
}

/**
 * Format price with currency symbol
 */
export function formatPrice(
  amount: number,
  currency: string,
  locale: string = "en-US"
): string {
  // Fallback symbols
  const symbols: Record<string, string> = {
    USD: "$",
    VND: "₫",
    KRW: "₩",
    CNY: "¥",
    JPY: "¥",
    INR: "₹",
    EUR: "€",
    GBP: "£",
  };

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency === "VND" ? "VND" : currency,
      minimumFractionDigits: currency === "VND" || currency === "JPY" || currency === "KRW" ? 0 : 2,
      maximumFractionDigits: currency === "VND" || currency === "JPY" || currency === "KRW" ? 0 : 2,
    }).format(amount);
  } catch (error) {
    // Fallback formatting if Intl fails
    const symbol = symbols[currency] || currency;
    const decimals = currency === "VND" || currency === "JPY" || currency === "KRW" ? 0 : 2;
    const formattedAmount = amount.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return currency === "VND" ? `${formattedAmount}${symbol}` : `${symbol}${formattedAmount}`;
  }
}

/**
 * Clear cached exchange rates
 */
export function clearExchangeRateCache(): void {
  storageAdapter.removeItem(CACHE_KEY);
}
