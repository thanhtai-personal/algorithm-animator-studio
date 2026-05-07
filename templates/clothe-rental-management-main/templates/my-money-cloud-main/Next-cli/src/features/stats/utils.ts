import { formatCompactNumber } from "@/lib/currency";
import {
  Locale,
  endOfDay,
  format,
  isAfter,
  isBefore,
  startOfDay,
} from "date-fns";
import { DateRange } from "react-day-picker";
import { Transaction } from "../transactions/types";

export const formatCompactLabel = (value: number, language: any) =>
  value > 0 ? formatCompactNumber(value, language) : "";

export function estimateTextWidth(text: string, fontSize: number, fontWeight = 400) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const weightFactor = fontWeight >= 600 ? 0.62 : 0.56;
  return Math.ceil(trimmed.length * fontSize * weightFactor);
}

export function getColumnWidth(labels: string[], fontSize: number, fontWeight = 400) {
  const longest = labels.reduce((maxLabel, label) => {
    return label.length > maxLabel.length ? label : maxLabel;
  }, "");
  const estimated = estimateTextWidth(longest, fontSize, fontWeight);
  return Math.max(60, estimated + 24);
}

export function formatRangeValue(range: DateRange | undefined, dateFormat: string, locale: Locale) {
  if (!range?.from) return "";
  if (range.to) {
    return `${format(range.from, dateFormat, { locale })} - ${format(range.to, dateFormat, { locale })}`;
  }
  return format(range.from, dateFormat, { locale });
}

export function resolveCategoryColor(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;
  return `hsl(var(--${value}))`;
}

export function normalizeRange(range: DateRange | undefined) {
  if (!range?.from) {
    return { start: null, end: null };
  }
  const start = startOfDay(range.from);
  if (!range.to) {
    return { start, end: endOfDay(range.from) };
  }
  const end = endOfDay(range.to);
  if (isAfter(start, end)) {
    return { start, end: endOfDay(start) };
  }
  return { start, end };
}

export function filterByRange(transactions: Transaction[], range: { start: Date | null; end: Date | null }) {
  if (!range.start && !range.end) return transactions;
  return transactions.filter((transaction) => {
    const date = transaction.date;
    if (range.start && isBefore(date, range.start)) return false;
    if (range.end && isAfter(date, range.end)) return false;
    return true;
  });
}
