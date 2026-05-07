import type {
  MakeupParsedBookingDraft,
  MakeupSessionSlot,
  ParseMakeupBookingInputPayload,
} from '../types/makeup-module.type';
import { MakeupDomainError } from '../infrastructure/makeup.data-access';

const DEFAULT_TIMEZONE_OFFSET = '+07:00';
const GUEST_COUNT_WORD_MAP: Record<string, number> = {
  mot: 1,
  hai: 2,
  ba: 3,
  bon: 4,
  tu: 4,
  nam: 5,
  lam: 5,
  sau: 6,
  bay: 7,
  tam: 8,
  chin: 9,
  muoi: 10,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function resolveSessionSlot(hour: number): MakeupSessionSlot {
  if (hour < 12) return 'MORNING';
  if (hour < 17) return 'AFTERNOON';
  return 'EVENING';
}

function normalizeForPattern(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveYearFromToken(
  value: string | undefined,
  referenceDate: Date,
): number {
  let year = Number.parseInt(value ?? '', 10);

  if (!Number.isFinite(year)) {
    year = referenceDate.getFullYear();
  } else if (year < 100) {
    year += 2000;
  }

  return year;
}

function parseGuestCount(rawInput: string): number | null {
  const normalized = normalizeForPattern(rawInput);

  const digitMatch = normalized.match(
    /(\d+)\s*(?:nguoi|khach|ban|suat|slot)\b/i,
  );
  if (digitMatch) {
    const parsed = Number.parseInt(digitMatch[1] ?? '0', 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  const makeupDigitMatch = normalized.match(
    /(?:make\\s*-?\\s*up|trang diem)\\s*(\\d+)\\b/i,
  );
  if (makeupDigitMatch) {
    const parsed = Number.parseInt(makeupDigitMatch[1] ?? '0', 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  for (const [word, value] of Object.entries(GUEST_COUNT_WORD_MAP)) {
    if (
      new RegExp(`\\b${word}\\s*(?:nguoi|khach|ban|suat|slot)\\b`, 'i').test(
        normalized,
      )
    ) {
      return value;
    }

    if (
      new RegExp(`(?:make\\s*-?\\s*up|trang diem)\\s*${word}\\b`, 'i').test(
        normalized,
      )
    ) {
      return value;
    }
  }

  return null;
}

function parseDateToken(token: string, referenceDate: Date): string | null {
  const trimmed = token.trim();
  if (!trimmed) return null;

  const normalized = normalizeForPattern(trimmed);

  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
    const [yearText, monthText, dayText] = trimmed.split('-');
    const year = Number.parseInt(yearText, 10);
    const month = Number.parseInt(monthText, 10);
    const day = Number.parseInt(dayText, 10);
    if (
      !Number.isFinite(year) ||
      !Number.isFinite(month) ||
      !Number.isFinite(day)
    )
      return null;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return `${year}-${pad2(month)}-${pad2(day)}`;
  }

  const monthWordMatch = normalized.match(
    /^(?:ngay\s+)?(\d{1,2})\s*thang\s*(\d{1,2})(?:\s*nam\s*(\d{2,4}))?$/,
  );
  if (monthWordMatch) {
    const day = Number.parseInt(monthWordMatch[1] ?? '0', 10);
    const month = Number.parseInt(monthWordMatch[2] ?? '0', 10);
    const year = resolveYearFromToken(monthWordMatch[3], referenceDate);

    if (
      !Number.isFinite(day) ||
      !Number.isFinite(month) ||
      !Number.isFinite(year)
    )
      return null;
    if (day < 1 || day > 31 || month < 1 || month > 12) return null;
    return `${year}-${pad2(month)}-${pad2(day)}`;
  }

  const slashMatch = trimmed.match(
    /^(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?$/,
  );
  if (!slashMatch) return null;

  const day = Number.parseInt(slashMatch[1] ?? '0', 10);
  const month = Number.parseInt(slashMatch[2] ?? '0', 10);
  const year = resolveYearFromToken(slashMatch[3], referenceDate);

  if (
    !Number.isFinite(day) ||
    !Number.isFinite(month) ||
    !Number.isFinite(year)
  )
    return null;
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;

  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function parseTimeFromSegment(
  segment: string,
): { hour: number; minute: number } | null {
  const normalized = segment.trim().toLowerCase();
  const normalizedAscii = normalizeForPattern(segment);
  if (!normalized) return null;

  const colonMatch = normalizedAscii.match(/(\d{1,2})\s*:\s*(\d{1,2})/);
  if (colonMatch) {
    const hour = Number.parseInt(colonMatch[1] ?? '0', 10);
    const minute = Number.parseInt(colonMatch[2] ?? '0', 10);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59)
      return { hour, minute };
  }

  const hMatch = normalizedAscii.match(/(\d{1,2})\s*h(?:\s*(\d{1,2}))?/);
  if (hMatch) {
    const hour = Number.parseInt(hMatch[1] ?? '0', 10);
    const minute = Number.parseInt(hMatch[2] ?? '0', 10);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59)
      return { hour, minute };
  }

  const hCompactMatch = normalizedAscii.match(/(\d{1,2})h(\d{1,2})?/);
  if (hCompactMatch) {
    const hour = Number.parseInt(hCompactMatch[1] ?? '0', 10);
    const minute = Number.parseInt(hCompactMatch[2] ?? '0', 10);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59)
      return { hour, minute };
  }

  const gioMatch = normalized.match(/(\d{1,2})\s*(?:giờ|gio)(?:\s*(\d{1,2}))?/);
  if (gioMatch) {
    const hour = Number.parseInt(gioMatch[1] ?? '0', 10);
    const minute = Number.parseInt(gioMatch[2] ?? '0', 10);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59)
      return { hour, minute };
  }

  const gioMatchAscii = normalizedAscii.match(
    /(\d{1,2})\s*gio(?:\s*(\d{1,2}))?/,
  );
  if (gioMatchAscii) {
    const hour = Number.parseInt(gioMatchAscii[1] ?? '0', 10);
    const minute = Number.parseInt(gioMatchAscii[2] ?? '0', 10);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59)
      return { hour, minute };
  }

  const keywordHourMatch = normalizedAscii.match(
    /\b(?:luc|vao)\s*(\d{1,2})(?:\s*(\d{1,2}))?\b/,
  );
  if (keywordHourMatch) {
    const hour = Number.parseInt(keywordHourMatch[1] ?? '0', 10);
    const minute = Number.parseInt(keywordHourMatch[2] ?? '0', 10);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59)
      return { hour, minute };
  }

  return null;
}

function resolveTimeFromSessionKeyword(
  raw: string,
): { hour: number; minute: number } | null {
  const normalized = normalizeForPattern(raw);
  if (/\b(?:sang|morning)\b/.test(normalized)) return { hour: 9, minute: 0 };
  if (/\b(?:chieu|afternoon)\b/.test(normalized))
    return { hour: 14, minute: 0 };
  if (/\b(?:toi|dem|evening|night)\b/.test(normalized))
    return { hour: 19, minute: 0 };
  return null;
}

function normalizePhone(value: string | null | undefined): string | null {
  if (!value) return null;
  const compact = value.replace(/[^\d+]/g, '');
  const digits = compact.replace(/\D/g, '');
  if (digits.length < 8) return null;
  return compact.startsWith('+') ? `+${digits}` : digits;
}

function extractDateToken(raw: string): string | null {
  const normalized = raw.trim();
  if (!normalized) return null;

  const normalizedAscii = normalizeForPattern(normalized);

  const named = normalized.match(
    /ngày\s+(\d{1,2}[/.-]\d{1,2}(?:[/.-]\d{2,4})?|\d{4}-\d{1,2}-\d{1,2}|\d{1,2}\s*(?:tháng|thang)\s*\d{1,2}(?:\s*(?:năm|nam)\s*\d{2,4})?)/i,
  );
  if (named?.[1]) return named[1];

  const namedAscii = normalizedAscii.match(
    /ngay\s+(\d{1,2}\s*thang\s*\d{1,2}(?:\s*nam\s*\d{2,4})?)/i,
  );
  if (namedAscii?.[1]) return namedAscii[1];

  const any = normalized.match(
    /(\d{1,2}[/.-]\d{1,2}(?:[/.-]\d{2,4})?|\d{4}-\d{1,2}-\d{1,2}|\d{1,2}\s*(?:tháng|thang)\s*\d{1,2}(?:\s*(?:năm|nam)\s*\d{2,4})?)/i,
  );
  if (any?.[1]) return any[1];

  const anyAscii = normalizedAscii.match(
    /(\d{1,2}\s*thang\s*\d{1,2}(?:\s*nam\s*\d{2,4})?)/,
  );
  return anyAscii?.[1] ?? null;
}

function extractTimeSegment(raw: string): string {
  const normalized = normalizeForPattern(raw);
  if (!normalized) return '';
  return normalized;
}

function extractCustomerName(rawInput: string): string {
  const match = rawInput.match(
    /\b(?:tên|ten)\b\s*[:-]?\s+(.+?)(?:\s+\b(?:sđt|sdt|điện thoại|dien thoai|số điện thoại|so dien thoai|phone|tel)\b|$)/i,
  );
  if (match?.[1]?.trim()) return match[1].trim();

  const fallback = rawInput.match(
    /\b(?:cho|chị|chi|anh|em)\b\s+([A-Za-zÀ-ỹ]+(?:\s+[A-Za-zÀ-ỹ]+){0,2})\b/i,
  );
  return fallback?.[1]?.trim() ?? '';
}

function extractPhoneByFallback(rawInput: string): string {
  const candidates = rawInput.match(/\+?\d[\d\s.-]{7,}\d/g);
  if (!candidates || candidates.length === 0) return '';

  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    const normalized = normalizePhone(candidates[index] ?? '');
    const digits = normalized?.replace(/\D/g, '') ?? '';
    if (digits.length >= 9) return normalized ?? '';
  }

  return '';
}

function extractCustomerPhone(rawInput: string): string {
  const match = rawInput.match(
    /\b(?:sđt|sdt|điện thoại|dien thoai|số điện thoại|so dien thoai|phone|tel)\b\s*[:-]?\s+(.+)$/i,
  );
  const normalized = normalizePhone(match?.[1] ?? '');
  if (normalized) return normalized;
  return extractPhoneByFallback(rawInput);
}

function sanitizeBookingNote(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .replace(/^[\s,.;:!?-–—]+|[\s,.;:!?-–—]+$/g, '')
    .trim();
}

function extractBookingNote(rawInput: string): string {
  const normalizedInput = rawInput.normalize('NFC');
  const match = normalizedInput.match(
    /(?:^|\s)(?:ghi\s*ch[uú]|note)\s*(?:[:-]|là|la)?\s*(.+)$/i,
  );
  if (!match?.[1]) return '';
  return sanitizeBookingNote(match[1]);
}

export function parseMakeupBookingInput(
  payload: ParseMakeupBookingInputPayload,
): MakeupParsedBookingDraft {
  const rawInput = payload.inputText.trim();
  if (!rawInput) {
    throw new MakeupDomainError('INVALID_BOOKING_INPUT', {
      reason: 'empty-input',
    });
  }

  const referenceDate = payload.referenceDate
    ? new Date(`${payload.referenceDate}T00:00:00`)
    : new Date();

  const guestCount = parseGuestCount(rawInput);
  const dateToken = extractDateToken(rawInput);
  const bookingDate = dateToken
    ? parseDateToken(dateToken, referenceDate)
    : null;

  const timeSegment = extractTimeSegment(rawInput);
  const time =
    parseTimeFromSegment(timeSegment) ??
    resolveTimeFromSessionKeyword(rawInput);
  const bookingTime = time ? `${pad2(time.hour)}:${pad2(time.minute)}` : null;
  const sessionSlot = time ? resolveSessionSlot(time.hour) : null;

  let startAtIso: string | null = null;
  if (bookingDate && bookingTime) {
    const startAt = new Date(
      `${bookingDate}T${bookingTime}:00${DEFAULT_TIMEZONE_OFFSET}`,
    );
    if (!Number.isNaN(startAt.getTime())) {
      startAtIso = startAt.toISOString();
    }
  }

  const durationMinutes = guestCount && guestCount > 0 ? guestCount * 80 : null;
  let endAtIso: string | null = null;
  if (startAtIso && durationMinutes) {
    const endAt = new Date(
      new Date(startAtIso).getTime() + durationMinutes * 60_000,
    );
    if (!Number.isNaN(endAt.getTime())) {
      endAtIso = endAt.toISOString();
    }
  }

  const customerName = extractCustomerName(rawInput);
  const customerPhone = extractCustomerPhone(rawInput);
  const note = extractBookingNote(rawInput);

  const parseWarnings: string[] = [];
  if (!guestCount || guestCount <= 0) parseWarnings.push('missing-guest-count');
  if (!bookingDate) parseWarnings.push('missing-booking-date');
  if (!bookingTime) parseWarnings.push('missing-booking-time');
  if (!customerName) parseWarnings.push('missing-customer-name');
  if (!customerPhone) parseWarnings.push('missing-customer-phone');

  return {
    inputMode: payload.inputMode,
    rawInput,
    guestCount: guestCount ?? undefined,
    bookingDate: bookingDate ?? undefined,
    bookingTime: bookingTime ?? undefined,
    sessionSlot: sessionSlot ?? undefined,
    startAt: startAtIso ?? undefined,
    endAt: endAtIso ?? undefined,
    durationMinutes: durationMinutes ?? undefined,
    customerName,
    customerPhone,
    note,
    parseWarnings,
  };
}
