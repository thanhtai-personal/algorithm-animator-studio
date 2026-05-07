import { format, isToday, isYesterday, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import type { Locale } from "date-fns";
import { enUS, vi, ja, zhCN, ko, hi } from "date-fns/locale";
import { Language } from "./constants/i18n";

interface DateLabels {
  today: string;
  yesterday: string;
}

interface DateFormatOptions {
  language?: Language;
  locale?: Locale;
  labels?: DateLabels;
}

const LOCALE_MAP: Record<Language, Locale> = {
  en: enUS,
  vi,
  ko,
  zh: zhCN,
  ja,
  hi,
};

function resolveLocale(language?: Language, locale?: Locale) {
  if (locale) return locale;
  if (!language) return enUS;
  return LOCALE_MAP[language] ?? enUS;
}

function resolveLabels(labels?: DateLabels): DateLabels {
  return labels ?? { today: 'Hôm nay', yesterday: 'Hôm qua' };
}

export function formatDate(date: Date, options: DateFormatOptions = {}): string {
  const labels = resolveLabels(options.labels);
  const locale = resolveLocale(options.language, options.locale);

  if (isToday(date)) {
    return labels.today;
  }
  if (isYesterday(date)) {
    return labels.yesterday;
  }
  const pattern = options.language === "vi" ? "dd/MM/yyyy" : "P";
  return format(date, pattern, { locale });
}

export function formatFullDate(date: Date, options: DateFormatOptions = {}): string {
  const locale = resolveLocale(options.language, options.locale);
  if (options.language === "vi") {
    return format(date, "EEEE, dd 'tháng' MM, yyyy", { locale });
  }
  return format(date, "PPPP", { locale });
}

export function formatTime(date: Date, options: DateFormatOptions = {}): string {
  const locale = resolveLocale(options.language, options.locale);
  return format(date, 'HH:mm', { locale });
}

export function formatMonthYear(date: Date, options: DateFormatOptions = {}): string {
  const locale = resolveLocale(options.language, options.locale);
  const pattern = options.language === "vi" ? "'Tháng' MM, yyyy" : "MMM yyyy";
  return format(date, pattern, { locale });
}

export function getWeekRange(date: Date): { start: Date; end: Date } {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  };
}

export function getMonthRange(date: Date): { start: Date; end: Date } {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

export function groupByDate<T extends { date: Date }>(items: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  
  items.forEach(item => {
    const key = format(item.date, 'yyyy-MM-dd');
    const existing = groups.get(key) || [];
    groups.set(key, [...existing, item]);
  });
  
  return groups;
}
