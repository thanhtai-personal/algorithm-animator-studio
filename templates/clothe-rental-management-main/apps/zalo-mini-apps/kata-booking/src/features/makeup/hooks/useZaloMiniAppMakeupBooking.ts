import { useCallback, useMemo, useState } from "react";
import { ApiClientError } from "@/lib/httpClient";
import { useVoiceDictationPrimitive } from "@/lib/voice/useVoiceDictationPrimitive";
import type { VoiceDictationError, VoiceDictationErrorCode } from "@/lib/voice/types";
import {
  useZaloMiniAppMakeupArtistsQuery,
  useCreatePublicMakeupBookingMutation,
  useParseMakeupBookingInputMutation,
} from "@/features/makeup/queries/useZaloMiniAppMakeupQueries";
import {
  buildMonthGrid,
  calculateDurationMinutes,
  formatMonthLabel,
  groupEventsByDate,
  resolveSessionSlotByLocalDateTime,
  toIsoDate,
  toIsoDateTime,
  toLocalDateTimeInput,
} from "@/features/makeup/utils/makeupBookingUtils";
import { zaloMiniAppMakeupStore } from "@/features/makeup/stores/zaloMiniAppMakeupStore";
import type {
  ZaloMiniAppCreateMakeupEventPayload,
  ZaloMiniAppMakeupInputMode,
} from "@/features/makeup/types/makeup";

const DEFAULT_GUEST_COUNT = "1";
const DEFAULT_BOOKING_TIME = "09:00";
const DEFAULT_DURATION_PER_GUEST_MINUTES = 80;

interface MakeupBookingFormState {
  artistProfileId: string;
  guestCount: string;
  bookingDate: string;
  startTime: string;
  endAtLocal: string;
  customerName: string;
  customerPhone: string;
  surchargeAmount: string;
  note: string;
}

function deriveAutoEndAtLocal(
  form: Pick<MakeupBookingFormState, "bookingDate" | "startTime" | "guestCount">
) {
  const startTime = form.startTime.trim() || DEFAULT_BOOKING_TIME;
  const startAtLocal = `${form.bookingDate}T${startTime}`;
  const start = new Date(startAtLocal);
  if (Number.isNaN(start.getTime())) return "";

  const guestCount = Number.parseInt(form.guestCount, 10);
  const normalizedGuestCount = Number.isFinite(guestCount) && guestCount > 0 ? guestCount : 1;
  const end = new Date(start.getTime() + normalizedGuestCount * DEFAULT_DURATION_PER_GUEST_MINUTES * 60_000);
  return toLocalDateTimeInput(end.toISOString());
}

function parseNonNegativeNumber(value: string): number | null {
  const normalized = value.trim();
  if (!normalized) return 0;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function mapVoiceErrorMessage(errorCode: VoiceDictationErrorCode): string {
  if (errorCode === "permission-denied") {
    return "Bạn đã từ chối quyền microphone. Hãy cấp quyền và thử lại.";
  }
  if (errorCode === "service-not-allowed") {
    return "Môi trường hiện tại không hỗ trợ voice input.";
  }
  if (errorCode === "network") {
    return "Lỗi kết nối khi nhận dạng giọng nói.";
  }
  if (errorCode === "no-speech") {
    return "Không nghe thấy giọng nói. Hãy thử lại.";
  }
  return "Không thể nhận dạng giọng nói. Hãy thử lại.";
}

export function useZaloMiniAppMakeupBooking() {
  const today = useMemo(() => new Date(), []);
  const minBookingDate = useMemo(() => toIsoDate(today), [today]);
  const defaultBranchId = useMemo(() => {
    const rawValue = import.meta.env.VITE_DEFAULT_BRANCH_ID as string | undefined;
    const normalized = rawValue?.trim();
    return normalized ? normalized : null;
  }, []);
  const [commandInput, setCommandInput] = useState("");
  const [commandInputMode, setCommandInputMode] = useState<ZaloMiniAppMakeupInputMode>("TEXT");
  const [form, setForm] = useState<MakeupBookingFormState>(() => {
    const bookingDate = minBookingDate;
    const guestCount = DEFAULT_GUEST_COUNT;
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
      customerName: "",
      customerPhone: "",
      surchargeAmount: "0",
      note: "",
    };
  });
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => minBookingDate);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const parseMutation = useParseMakeupBookingInputMutation();
  const createMutation = useCreatePublicMakeupBookingMutation();
  const artistsQuery = useZaloMiniAppMakeupArtistsQuery(defaultBranchId);

  const monthGrid = useMemo(() => buildMonthGrid(anchorDate), [anchorDate]);
  const monthLabel = useMemo(() => formatMonthLabel(anchorDate), [anchorDate]);
  const eventsByDate = groupEventsByDate(zaloMiniAppMakeupStore.createdEvents);
  const artists = useMemo(
    () => artistsQuery.data?.items ?? [],
    [artistsQuery.data?.items]
  );
  const selectedArtistProfileId = useMemo(() => {
    if (artists.length === 0) return "";
    const hasSelectedArtist = artists.some(
      (artist) => artist.profileId === form.artistProfileId
    );
    if (hasSelectedArtist) return form.artistProfileId;
    return artists[0]?.profileId ?? "";
  }, [artists, form.artistProfileId]);
  const selectedDateEvents = useMemo(
    () => eventsByDate.get(selectedDate) ?? [],
    [eventsByDate, selectedDate]
  );
  const calculatedEndAtLocal = form.endAtLocal || deriveAutoEndAtLocal(form);

  const clearStatus = useCallback(() => {
    setErrorMessage(null);
    setSuccessMessage(null);
  }, []);

  const onFormChange = (field: keyof MakeupBookingFormState, value: string) => {
    clearStatus();
    setForm((previous) => {
      const next = {
        ...previous,
        [field]: value,
      } as MakeupBookingFormState;

      if (field === "guestCount" || field === "bookingDate" || field === "startTime") {
        next.endAtLocal = deriveAutoEndAtLocal(next);
      }

      return next;
    });
  };

  const onCommandInputChange = (value: string) => {
    clearStatus();
    setCommandInputMode("TEXT");
    setCommandInput(value);
  };

  const parseInput = useCallback(
    async (params?: { inputText?: string; inputMode?: ZaloMiniAppMakeupInputMode }) => {
      clearStatus();

      const normalizedInput = (params?.inputText ?? commandInput).trim();
      const inputMode = params?.inputMode ?? "TEXT";
      if (!normalizedInput) {
        setErrorMessage("Vui lòng nhập câu lệnh đặt lịch.");
        return;
      }

      setCommandInput(normalizedInput);
      setCommandInputMode(inputMode);

      try {
        const draft = await parseMutation.mutateAsync({
          inputMode,
          inputText: normalizedInput,
          referenceDate: minBookingDate,
        });

        const parsedStartAtLocal = draft.startAt
          ? toLocalDateTimeInput(draft.startAt)
          : "";
        const [parsedDateFromStartAt = "", parsedTimeFromStartAt = ""] =
          parsedStartAtLocal.split("T");
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
          setSuccessMessage("Không nhận diện thêm thông tin mới. Giữ nguyên dữ liệu hiện tại.");
          return;
        }

        setForm((previous) => {
          const next: MakeupBookingFormState = {
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
          setAnchorDate(new Date(`${parsedBookingDate}T00:00:00`));
        }
        setSuccessMessage("Đã cập nhật thông tin từ câu lệnh.");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Không thể phân tích câu lệnh.";
        setErrorMessage(message);
      }
    },
    [clearStatus, commandInput, minBookingDate, parseMutation]
  );

  const handleVoiceResult = useCallback(
    (transcript: string) => {
      const normalized = transcript.trim();
      if (!normalized) return;

      clearStatus();
      setCommandInput(normalized);
      setCommandInputMode("VOICE");
      void parseInput({
        inputText: normalized,
        inputMode: "VOICE",
      });
    },
    [clearStatus, parseInput]
  );

  const handleVoiceError = useCallback((error: VoiceDictationError) => {
    setErrorMessage(mapVoiceErrorMessage(error.code));
  }, []);

  const voice = useVoiceDictationPrimitive({
    language: "vi-VN",
    disabled: parseMutation.isPending || createMutation.isPending,
    autoStop: true,
    onResult: handleVoiceResult,
    onError: handleVoiceError,
  });

  const buildCreatePayload = (): ZaloMiniAppCreateMakeupEventPayload | null => {
    if (form.bookingDate < minBookingDate) {
      setErrorMessage("Không thể đặt lịch vào ngày đã qua.");
      return null;
    }

    const guestCount = Number.parseInt(form.guestCount, 10);
    if (!Number.isFinite(guestCount) || guestCount <= 0) {
      setErrorMessage("Số người không hợp lệ.");
      return null;
    }

    const startTime = form.startTime.trim() || DEFAULT_BOOKING_TIME;
    const startAtLocal = `${form.bookingDate}T${startTime}`;
    const startAtIso = toIsoDateTime(startAtLocal);
    if (!startAtIso) {
      setErrorMessage("Thời gian bắt đầu không hợp lệ.");
      return null;
    }

    const endAtIso = toIsoDateTime(form.endAtLocal.trim() || deriveAutoEndAtLocal(form));

    if (!endAtIso) {
      setErrorMessage("Thời gian kết thúc không hợp lệ.");
      return null;
    }
    const durationMinutes = calculateDurationMinutes(startAtIso, endAtIso);
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      setErrorMessage("Thời gian kết thúc phải lớn hơn giờ bắt đầu.");
      return null;
    }

    const surchargeAmount = parseNonNegativeNumber(form.surchargeAmount);
    if (surchargeAmount === null) {
      setErrorMessage("Phụ phí không hợp lệ.");
      return null;
    }

    return {
      branchId: defaultBranchId,
      eventDate: form.bookingDate,
      sessionSlot: resolveSessionSlotByLocalDateTime(startAtLocal),
      startAt: startAtIso,
      endAt: endAtIso,
      artistProfileId: selectedArtistProfileId || null,
      customerName: form.customerName.trim() || null,
      customerPhone: form.customerPhone.trim() || null,
      guestCount,
      durationMinutes,
      surchargeAmount,
      note: form.note.trim() || null,
      sourceInputMode: commandInputMode,
      sourceInputText: commandInput.trim() || null,
    };
  };

  const submitBooking = async () => {
    clearStatus();

    const payload = buildCreatePayload();
    if (!payload) return;

    try {
      await createMutation.mutateAsync(payload);
      setSuccessMessage("Đã tạo lịch makeup thành công.");
      setSelectedDate(payload.eventDate);
      setAnchorDate(new Date(`${payload.eventDate}T00:00:00`));
    } catch (error) {
      if (error instanceof ApiClientError && error.message === "CONFLICT_WARNING_REQUIRED") {
        setErrorMessage("Lịch đang bị trùng khung giờ. Vui lòng chọn giờ khác.");
        return;
      }

      const message = error instanceof Error ? error.message : "Tạo lịch makeup thất bại.";
      setErrorMessage(message);
    }
  };

  return {
    commandInput,
    onCommandInputChange,
    parseInput,
    clearInput: () => {
      voice.abort();
      setCommandInput("");
      setCommandInputMode("TEXT");
      clearStatus();
    },
    voice,
    onStartVoiceInput: () => voice.start(),
    onStopVoiceInput: () => voice.stop(),
    form,
    artists,
    artistsQuery,
    selectedArtistProfileId,
    onFormChange,
    submitBooking,
    isBusy: parseMutation.isPending || createMutation.isPending,
    parseMutation,
    createMutation,
    errorMessage,
    successMessage,
    minBookingDate,
    calculatedEndAtLocal,
    monthGrid,
    monthLabel,
    selectedDate,
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
    lastCreatedEvent: zaloMiniAppMakeupStore.lastCreatedEvent,
  };
}

export type ZaloMiniAppMakeupBookingModel = ReturnType<typeof useZaloMiniAppMakeupBooking>;
