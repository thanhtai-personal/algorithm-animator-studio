"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { AppLocale } from "@/constants/locale";
import { useVoiceDictationPrimitive } from "@/components/voice/hooks/useVoiceDictationPrimitive";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import { MAKEUP_PRODUCT_BOOKING_COPY } from "@/features/makeup/hooks/makeupProductBookingCopy";
import {
  buildMonthGrid,
  calculateDurationMinutes,
  formatMonthLabel,
  resolveErrorMessage,
  resolveSessionSlotByLocalDateTime,
  toIsoDate,
  toIsoDateTime,
  toLocalDateTimeInput,
} from "@/features/makeup/hooks/makeupProductBookingUtils";
import {
  useCreateMakeupEventMutation,
  useMakeupArtistsQuery,
  useMakeupEventsQuery,
  useParseMakeupBookingInputMutation,
} from "@/features/makeup/queries/useMakeupQueries";
import { MakeupApiError } from "@/features/makeup/services/makeupClientService";
import type {
  CreateMakeupEventPayload,
  MakeupBookingInputMode,
  MakeupEventDto,
} from "@/types/makeupModule";

const CREATE_ALLOWED_ROLE_SET = new Set([
  "owner_admin",
  "manager",
  "staff",
  "makeup_artist",
]);
const DEFAULT_BOOKING_TIME = "09:00";
const DEFAULT_DURATION_PER_GUEST_MINUTES = 80;

export interface BookingFormState {
  artistProfileId: string;
  guestCount: string;
  bookingDate: string;
  startTime: string;
  endAtLocal: string;
  surchargeAmount: string;
  customerName: string;
  customerPhone: string;
  note: string;
}

function deriveAutoEndAtLocal(form: Pick<BookingFormState, "bookingDate" | "startTime" | "guestCount">) {
  const startTime = form.startTime.trim() || DEFAULT_BOOKING_TIME;
  const startAtLocal = `${form.bookingDate}T${startTime}`;
  const startAt = new Date(startAtLocal);
  if (Number.isNaN(startAt.getTime())) return "";

  const guestCount = Number.parseInt(form.guestCount, 10);
  const normalizedGuestCount = Number.isFinite(guestCount) && guestCount > 0 ? guestCount : 1;
  const endAt = new Date(
    startAt.getTime() + normalizedGuestCount * DEFAULT_DURATION_PER_GUEST_MINUTES * 60_000
  );
  return toLocalDateTimeInput(endAt.toISOString());
}

export function useMakeupProductBooking(
  locale: AppLocale,
  options?: {
    publicBranchId?: string | null;
  }
) {
  const copy = MAKEUP_PRODUCT_BOOKING_COPY[locale];
  const { role, profile, currentBranchId, hasCloudSession } = useAuthAccess();
  const bookingBranchId = options?.publicBranchId ?? currentBranchId;
  const canCreateByRole = Boolean(
    role && hasCloudSession && CREATE_ALLOWED_ROLE_SET.has(role) && currentBranchId
  );
  const isPublicCreateMode = Boolean(options?.publicBranchId);
  const canCreate = Boolean(canCreateByRole || bookingBranchId);
  const minBookingDate = useMemo(() => toIsoDate(new Date()), []);

  const [activeInputMode, setActiveInputMode] = useState<MakeupBookingInputMode>("TEXT");
  const [commandInput, setCommandInput] = useState("");
  const [form, setForm] = useState<BookingFormState>(() => {
    const bookingDate = toIsoDate(new Date());
    const guestCount = "1";
    const startTime = DEFAULT_BOOKING_TIME;
    return {
      artistProfileId: "",
      guestCount,
      bookingDate,
      startTime,
      endAtLocal: deriveAutoEndAtLocal({
        bookingDate,
        startTime,
        guestCount,
      }),
      surchargeAmount: "0",
      customerName: "",
      customerPhone: "",
      note: "",
    };
  });
  const [selectedDate, setSelectedDate] = useState(() => toIsoDate(new Date()));
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [lastParseSuccessAt, setLastParseSuccessAt] = useState(0);
  const parseRequestVersionRef = useRef(0);
  const parseInputRef = useRef<
    (inputTextOverride?: string, inputModeOverride?: MakeupBookingInputMode) => Promise<boolean>
  >(async () => false);
  const [hasTouchedArtistSelection, setHasTouchedArtistSelection] = useState(false);

  const monthGrid = useMemo(() => buildMonthGrid(anchorDate), [anchorDate]);
  const monthLabel = useMemo(() => formatMonthLabel(anchorDate, locale), [anchorDate, locale]);
  const queryRange = useMemo(
    () => ({
      startDate: monthGrid[0]?.[0] ?? toIsoDate(new Date()),
      endDate:
        monthGrid[monthGrid.length - 1]?.[monthGrid[monthGrid.length - 1].length - 1] ??
        toIsoDate(new Date()),
    }),
    [monthGrid]
  );

  const artistsQuery = useMakeupArtistsQuery(
    currentBranchId,
    hasCloudSession && canCreateByRole
  );
  const eventsQuery = useMakeupEventsQuery(
    {
      branchId: currentBranchId,
      startDate: queryRange.startDate,
      endDate: queryRange.endDate,
      artistProfileId: role === "makeup_artist" ? profile?.id ?? undefined : undefined,
    },
    hasCloudSession && Boolean(currentBranchId)
  );
  const parseMutation = useParseMakeupBookingInputMutation();
  const createMutation = useCreateMakeupEventMutation();

  const voice = useVoiceDictationPrimitive({
    language: locale === "vi" ? "vi-VN" : "en-US",
    autoStop: true,
    disabled: parseMutation.isPending || createMutation.isPending,
    onResult: (transcript) => {
      const value = transcript.trim();
      if (!value) return;
      setActiveInputMode("VOICE");
      setCommandInput(value);
      void parseInputRef.current(value, "VOICE");
    },
  });

  const artists = useMemo(() => artistsQuery.data?.items ?? [], [artistsQuery.data?.items]);
  const selectedArtistProfileId = (() => {
    if (role === "makeup_artist" && profile?.id) {
      return profile.id;
    }

    const currentArtistProfileId = form.artistProfileId;
    if (currentArtistProfileId) {
      if (artists.length === 0) return currentArtistProfileId;

      const isCurrentArtistPresent = artists.some(
        (artist) => artist.profileId === currentArtistProfileId
      );
      if (isCurrentArtistPresent) return currentArtistProfileId;

      return artists[0]?.profileId ?? "";
    }

    if (!hasTouchedArtistSelection && artists.length > 0) {
      return artists[0]?.profileId ?? "";
    }

    return "";
  })();

  const eventsByDate = useMemo(() => {
    const events = eventsQuery.data?.events ?? [];
    const map = new Map<string, MakeupEventDto[]>();
    for (const entry of events) {
      const bucket = map.get(entry.eventDate) ?? [];
      bucket.push(entry);
      map.set(entry.eventDate, bucket);
    }

    for (const [key, bucket] of map) {
      map.set(
        key,
        [...bucket].sort((left, right) => {
          if (left.startAt === right.startAt) return left.createdAt.localeCompare(right.createdAt);
          return left.startAt.localeCompare(right.startAt);
        })
      );
    }

    return map;
  }, [eventsQuery.data?.events]);

  const selectedDateEvents = useMemo(
    () => eventsByDate.get(selectedDate) ?? [],
    [eventsByDate, selectedDate]
  );
  const calculatedEndAtLocal = form.endAtLocal || deriveAutoEndAtLocal(form);

  const onCommandInputChange = (value: string) => {
    parseRequestVersionRef.current += 1;
    voice.abort();
    setActiveInputMode("TEXT");
    setCommandInput(value);
  };

  const onStartVoiceInput = () => {
    parseRequestVersionRef.current += 1;
    setActiveInputMode("VOICE");
    void voice.start();
  };

  const onStopVoiceInput = () => {
    voice.stop();
  };

  const onFormChange = (field: keyof BookingFormState, value: string) => {
    parseRequestVersionRef.current += 1;
    if (field === "artistProfileId") {
      if (role === "makeup_artist") return;
      setHasTouchedArtistSelection(true);
    }

    setForm((previous) => {
      const next = {
        ...previous,
        [field]: value,
      } as BookingFormState;

      if (field === "guestCount" || field === "bookingDate" || field === "startTime") {
        next.endAtLocal = deriveAutoEndAtLocal(next);
      }

      return next;
    });
  };

  const onClearInput = () => {
    parseRequestVersionRef.current += 1;
    voice.abort();
    setCommandInput("");
  };

  const onParseInput = useCallback(
    async (
      inputTextOverride?: string,
      inputModeOverride?: MakeupBookingInputMode
    ): Promise<boolean> => {
      const inputText = (inputTextOverride ?? commandInput).trim();
      if (!inputText) return false;
      const requestVersion = parseRequestVersionRef.current + 1;
      parseRequestVersionRef.current = requestVersion;

      try {
        const draft = await parseMutation.mutateAsync({
          inputMode: inputModeOverride ?? activeInputMode,
          inputText,
          referenceDate: toIsoDate(new Date()),
        });
        if (requestVersion !== parseRequestVersionRef.current) {
          return false;
        }

        const parsedStartAtLocal = draft.startAt
          ? toLocalDateTimeInput(draft.startAt)
          : "";
        const [parsedDateFromStartAt = "", parsedTimeFromStartAt = ""] = parsedStartAtLocal.split("T");
        const parsedBookingDate = draft.bookingDate?.trim() || parsedDateFromStartAt;
        const parsedStartTime = draft.bookingTime?.trim() || parsedTimeFromStartAt;
        const parsedCustomerName = draft.customerName?.trim();
        const parsedCustomerPhone = draft.customerPhone?.trim();
        const parsedNote = draft.note?.trim();
        const hasGuestCount = Number.isFinite(draft.guestCount) && (draft.guestCount ?? 0) > 0;
        const hasAnyParsedValue = Boolean(
          hasGuestCount ||
            parsedBookingDate ||
            parsedStartTime ||
            parsedCustomerName ||
            parsedCustomerPhone ||
            parsedNote
        );
        if (!hasAnyParsedValue) {
          return false;
        }

        setForm((previous) => {
          const next: BookingFormState = {
            ...previous,
            guestCount: hasGuestCount ? String(draft.guestCount) : previous.guestCount,
            bookingDate: parsedBookingDate || previous.bookingDate,
            startTime: parsedStartTime || previous.startTime,
            customerName: parsedCustomerName || previous.customerName,
            customerPhone: parsedCustomerPhone || previous.customerPhone,
            note: parsedNote || previous.note,
            endAtLocal: previous.endAtLocal,
          };
          const parsedEndAtLocal = draft.endAt ? toLocalDateTimeInput(draft.endAt) : "";
          next.endAtLocal = parsedEndAtLocal || deriveAutoEndAtLocal(next);
          return next;
        });
        if (parsedBookingDate) {
          setSelectedDate(parsedBookingDate);
        }
        setLastParseSuccessAt(Date.now());
        return true;
      } catch (error) {
        if (requestVersion !== parseRequestVersionRef.current) {
          return false;
        }
        toast.error(resolveErrorMessage(error, copy, copy.parseFailed));
        return false;
      }
    },
    [activeInputMode, commandInput, copy, parseMutation]
  );

  useEffect(() => {
    parseInputRef.current = onParseInput;
  }, [onParseInput]);

  const buildPayload = (): CreateMakeupEventPayload | null => {
    if (!canCreate) {
      toast.error(hasCloudSession ? copy.unsupportedRole : copy.noSessionHint);
      return null;
    }
    if (!bookingBranchId) {
      toast.error(copy.invalidFormHint);
      return null;
    }
    if (form.bookingDate < minBookingDate) {
      toast.error(copy.invalidPastDateHint);
      return null;
    }

    const guestCount = Number.parseInt(form.guestCount, 10);
    if (!Number.isFinite(guestCount) || guestCount <= 0) {
      toast.error(copy.invalidFormHint);
      return null;
    }

    const startTime = form.startTime.trim() || DEFAULT_BOOKING_TIME;
    const startAtLocal = `${form.bookingDate}T${startTime}`;
    const startAt = toIsoDateTime(startAtLocal);
    if (!startAt) {
      toast.error(copy.invalidFormHint);
      return null;
    }

    const endAt = toIsoDateTime(form.endAtLocal.trim() || deriveAutoEndAtLocal(form));
    if (!endAt) {
      toast.error(copy.invalidFormHint);
      return null;
    }
    const durationMinutes = calculateDurationMinutes(startAt, endAt);
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      toast.error(copy.invalidFormHint);
      return null;
    }
    const surchargeAmount = Number.parseFloat(form.surchargeAmount);
    if (!Number.isFinite(surchargeAmount) || surchargeAmount < 0) {
      toast.error(copy.invalidFormHint);
      return null;
    }

    return {
      branchId: bookingBranchId,
      eventDate: form.bookingDate,
      sessionSlot: resolveSessionSlotByLocalDateTime(startAtLocal),
      startAt,
      endAt,
      artistProfileId: selectedArtistProfileId || null,
      requestAsPublic: isPublicCreateMode,
      customerName: form.customerName || null,
      customerPhone: form.customerPhone || null,
      guestCount,
      durationMinutes,
      surchargeAmount,
      note: form.note || null,
      sourceInputMode: activeInputMode,
      sourceInputText: commandInput || null,
    };
  };

  const submitBooking = async (): Promise<boolean> => {
    parseRequestVersionRef.current += 1;
    const payload = buildPayload();
    if (!payload) return false;

    try {
      await createMutation.mutateAsync({
        ...payload,
        confirmConflictOverride: false,
      });
      setSelectedDate(payload.eventDate);
      toast.success(copy.saveSuccess);
      return true;
    } catch (error) {
      if (
        error instanceof MakeupApiError &&
        error.message === "CONFLICT_WARNING_REQUIRED" &&
        Array.isArray(error.context?.conflicts)
      ) {
        toast.error(copy.conflictHint);
        return false;
      }

      toast.error(resolveErrorMessage(error, copy, copy.invalidFormHint));
      return false;
    }
  };

  return {
    locale,
    copy,
    canCreate,
    isPublicCreateMode,
    role,
    hasCloudSession,
    activeInputMode,
    commandInput,
    lastParseSuccessAt,
    onCommandInputChange,
    onStartVoiceInput,
    onStopVoiceInput,
    onClearInput,
    onParseInput,
    voice,
    form,
    selectedArtistProfileId,
    onFormChange,
    onSubmitBooking: submitBooking,
    parseMutation,
    createMutation,
    artists,
    eventsQuery,
    monthGrid,
    monthLabel,
    selectedDate,
    minBookingDate,
    calculatedEndAtLocal,
    setSelectedDate,
    selectedDateEvents,
    eventsByDate,
    anchorDate,
    goPrevMonth: () =>
      setAnchorDate((previous) => new Date(previous.getFullYear(), previous.getMonth() - 1, 1)),
    goNextMonth: () =>
      setAnchorDate((previous) => new Date(previous.getFullYear(), previous.getMonth() + 1, 1)),
    goToday: () => {
      const now = new Date();
      setAnchorDate(now);
      setSelectedDate(toIsoDate(now));
    },
  };
}

export type MakeupProductBookingModel = ReturnType<typeof useMakeupProductBooking>;
