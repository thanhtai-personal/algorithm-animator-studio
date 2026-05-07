import type {
  CreateMakeupEventPayload,
  CreateMakeupPackagePayload,
  MakeupBookingInputMode,
  MakeupEventStatus,
  MakeupSessionSlot,
  ParseMakeupBookingInputPayload,
  UpdateMakeupEventPayload,
  UpdateMakeupPackagePayload,
} from '../../types/makeup-module.type';

const SESSION_SLOT_SET = new Set<MakeupSessionSlot>([
  'MORNING',
  'AFTERNOON',
  'EVENING',
]);
const EVENT_STATUS_SET = new Set<MakeupEventStatus>([
  'BOOKED',
  'COMPLETED',
  'CANCELLED',
]);
const INPUT_MODE_SET = new Set<MakeupBookingInputMode>(['VOICE', 'TEXT']);

export function parseString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseDateString(value: unknown): string | null {
  const text = parseString(value);
  if (!text || !/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  return text;
}

export function parseDateTimeString(value: unknown): string | null {
  const text = parseString(value);
  if (!text) return null;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function parseNumber(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

export function parseBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  return undefined;
}

function parseInputMode(value: unknown): MakeupBookingInputMode | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  if (!INPUT_MODE_SET.has(normalized as MakeupBookingInputMode)) return null;
  return normalized as MakeupBookingInputMode;
}

export function parseSessionSlot(value: unknown): MakeupSessionSlot | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  if (!SESSION_SLOT_SET.has(normalized as MakeupSessionSlot)) return null;
  return normalized as MakeupSessionSlot;
}

function parseEventStatus(value: unknown): MakeupEventStatus | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  if (!EVENT_STATUS_SET.has(normalized as MakeupEventStatus)) return null;
  return normalized as MakeupEventStatus;
}

export function parseRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function parseCreateMakeupEventPayload(
  body: Record<string, unknown>,
): CreateMakeupEventPayload | null {
  const eventDate = parseDateString(body.eventDate);
  if (!eventDate) {
    return null;
  }

  let artistProfileId: string | null | undefined;
  if (Object.prototype.hasOwnProperty.call(body, 'artistProfileId')) {
    if (body.artistProfileId === null) {
      artistProfileId = null;
    } else {
      const parsedArtist = parseString(body.artistProfileId);
      if (parsedArtist) {
        artistProfileId = parsedArtist;
      } else if (typeof body.artistProfileId === 'string') {
        artistProfileId = null;
      } else {
        return null;
      }
    }
  }

  let sessionSlot: MakeupSessionSlot | undefined;
  if (Object.prototype.hasOwnProperty.call(body, 'sessionSlot')) {
    const parsedSessionSlot = parseSessionSlot(body.sessionSlot);
    if (!parsedSessionSlot) return null;
    sessionSlot = parsedSessionSlot;
  }

  let sourceInputMode: MakeupBookingInputMode | null | undefined;
  if (Object.prototype.hasOwnProperty.call(body, 'sourceInputMode')) {
    sourceInputMode =
      body.sourceInputMode === null
        ? null
        : parseInputMode(body.sourceInputMode);
    if (sourceInputMode === null && body.sourceInputMode !== null) return null;
  }

  const payload: CreateMakeupEventPayload = {
    branchId: parseString(body.branchId),
    eventDate,
    sessionSlot,
    startAt:
      body.startAt === undefined
        ? undefined
        : parseDateTimeString(body.startAt),
    endAt:
      body.endAt === undefined ? undefined : parseDateTimeString(body.endAt),
    artistProfileId,
    customerId:
      body.customerId === undefined ? undefined : parseString(body.customerId),
    customerName:
      body.customerName === undefined
        ? undefined
        : parseString(body.customerName),
    customerPhone:
      body.customerPhone === undefined
        ? undefined
        : parseString(body.customerPhone),
    guestCount:
      body.guestCount === undefined ? undefined : parseNumber(body.guestCount),
    durationMinutes:
      body.durationMinutes === undefined
        ? undefined
        : parseNumber(body.durationMinutes),
    packageId:
      body.packageId === undefined ? undefined : parseString(body.packageId),
    note: body.note === undefined ? undefined : parseString(body.note),
    priceAmount:
      body.priceAmount === undefined
        ? undefined
        : parseNumber(body.priceAmount),
    surchargeAmount:
      body.surchargeAmount === undefined
        ? undefined
        : parseNumber(body.surchargeAmount),
    costAmount:
      body.costAmount === undefined ? undefined : parseNumber(body.costAmount),
    sourceInputMode,
    sourceInputText:
      body.sourceInputText === undefined
        ? undefined
        : parseString(body.sourceInputText),
    confirmConflictOverride: parseBoolean(body.confirmConflictOverride),
  };

  if (
    Object.prototype.hasOwnProperty.call(body, 'startAt') &&
    payload.startAt === null
  ) {
    return null;
  }
  if (
    Object.prototype.hasOwnProperty.call(body, 'endAt') &&
    payload.endAt === null
  ) {
    return null;
  }

  if (body.status !== undefined) {
    const status = parseEventStatus(body.status);
    if (!status) return null;
    payload.status = status;
  }

  return payload;
}

export function parseUpdateMakeupEventPayload(
  body: Record<string, unknown>,
): UpdateMakeupEventPayload | null {
  const payload: UpdateMakeupEventPayload = {};

  if (Object.prototype.hasOwnProperty.call(body, 'eventDate')) {
    const eventDate = parseDateString(body.eventDate);
    if (!eventDate) return null;
    payload.eventDate = eventDate;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'sessionSlot')) {
    const sessionSlot = parseSessionSlot(body.sessionSlot);
    if (!sessionSlot) return null;
    payload.sessionSlot = sessionSlot;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'startAt')) {
    if (body.startAt === null) {
      payload.startAt = null;
    } else {
      const startAt = parseDateTimeString(body.startAt);
      if (!startAt) return null;
      payload.startAt = startAt;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'endAt')) {
    if (body.endAt === null) {
      payload.endAt = null;
    } else {
      const endAt = parseDateTimeString(body.endAt);
      if (!endAt) return null;
      payload.endAt = endAt;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'artistProfileId')) {
    if (body.artistProfileId === null) {
      payload.artistProfileId = null;
    } else {
      const artistProfileId = parseString(body.artistProfileId);
      if (artistProfileId) {
        payload.artistProfileId = artistProfileId;
      } else if (typeof body.artistProfileId === 'string') {
        payload.artistProfileId = null;
      } else {
        return null;
      }
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'customerId')) {
    payload.customerId =
      body.customerId === null ? null : parseString(body.customerId);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'customerName')) {
    payload.customerName =
      body.customerName === null ? null : parseString(body.customerName);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'customerPhone')) {
    payload.customerPhone =
      body.customerPhone === null ? null : parseString(body.customerPhone);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'guestCount')) {
    const guestCount = parseNumber(body.guestCount);
    if (guestCount === undefined) return null;
    payload.guestCount = guestCount;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'durationMinutes')) {
    const durationMinutes = parseNumber(body.durationMinutes);
    if (durationMinutes === undefined) return null;
    payload.durationMinutes = durationMinutes;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'packageId')) {
    payload.packageId =
      body.packageId === null ? null : parseString(body.packageId);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'status')) {
    const status = parseEventStatus(body.status);
    if (!status) return null;
    payload.status = status;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'note')) {
    payload.note = body.note === null ? null : parseString(body.note);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'priceAmount')) {
    const priceAmount = parseNumber(body.priceAmount);
    if (priceAmount === undefined) return null;
    payload.priceAmount = priceAmount;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'costAmount')) {
    const costAmount = parseNumber(body.costAmount);
    if (costAmount === undefined) return null;
    payload.costAmount = costAmount;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'surchargeAmount')) {
    const surchargeAmount = parseNumber(body.surchargeAmount);
    if (surchargeAmount === undefined) return null;
    payload.surchargeAmount = surchargeAmount;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'confirmConflictOverride')) {
    const confirmConflictOverride = parseBoolean(body.confirmConflictOverride);
    if (confirmConflictOverride === undefined) return null;
    payload.confirmConflictOverride = confirmConflictOverride;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'sourceInputMode')) {
    if (body.sourceInputMode === null) {
      payload.sourceInputMode = null;
    } else {
      const sourceInputMode = parseInputMode(body.sourceInputMode);
      if (!sourceInputMode) return null;
      payload.sourceInputMode = sourceInputMode;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'sourceInputText')) {
    payload.sourceInputText =
      body.sourceInputText === null ? null : parseString(body.sourceInputText);
  }

  if (Object.keys(payload).length === 0) {
    return null;
  }

  return payload;
}

export function parseCreateMakeupPackagePayload(
  body: Record<string, unknown>,
): CreateMakeupPackagePayload | null {
  const code = parseString(body.code);
  const name = parseString(body.name);
  const durationMinutes = parseNumber(body.durationMinutes);
  const priceAmount = parseNumber(body.priceAmount);
  const costAmount = parseNumber(body.costAmount);

  if (
    !code ||
    !name ||
    durationMinutes === undefined ||
    priceAmount === undefined ||
    costAmount === undefined
  ) {
    return null;
  }

  const payload: CreateMakeupPackagePayload = {
    branchId: parseString(body.branchId),
    code,
    name,
    description:
      body.description === undefined
        ? undefined
        : parseString(body.description),
    durationMinutes,
    priceAmount,
    costAmount,
    isActive: parseBoolean(body.isActive),
  };

  return payload;
}

export function parseUpdateMakeupPackagePayload(
  body: Record<string, unknown>,
): UpdateMakeupPackagePayload | null {
  const payload: UpdateMakeupPackagePayload = {};

  if (Object.prototype.hasOwnProperty.call(body, 'code')) {
    const code = parseString(body.code);
    if (!code) return null;
    payload.code = code;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'name')) {
    const name = parseString(body.name);
    if (!name) return null;
    payload.name = name;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'description')) {
    payload.description =
      body.description === null ? null : parseString(body.description);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'durationMinutes')) {
    const durationMinutes = parseNumber(body.durationMinutes);
    if (durationMinutes === undefined) return null;
    payload.durationMinutes = durationMinutes;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'priceAmount')) {
    const priceAmount = parseNumber(body.priceAmount);
    if (priceAmount === undefined) return null;
    payload.priceAmount = priceAmount;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'costAmount')) {
    const costAmount = parseNumber(body.costAmount);
    if (costAmount === undefined) return null;
    payload.costAmount = costAmount;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'isActive')) {
    const isActive = parseBoolean(body.isActive);
    if (isActive === undefined) return null;
    payload.isActive = isActive;
  }

  if (Object.keys(payload).length === 0) {
    return null;
  }

  return payload;
}

export function parseMakeupBookingInputPayload(
  body: Record<string, unknown>,
): ParseMakeupBookingInputPayload | null {
  const inputMode = parseInputMode(body.inputMode);
  const inputText = parseString(body.inputText);
  if (!inputMode || !inputText) return null;

  return {
    inputMode,
    inputText,
    referenceDate:
      body.referenceDate === undefined
        ? undefined
        : parseDateString(body.referenceDate),
  };
}
