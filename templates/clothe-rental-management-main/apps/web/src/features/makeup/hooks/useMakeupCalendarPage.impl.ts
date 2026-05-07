"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { AppLocale } from "@/constants/locale";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import {
  useCreateCustomerMutation,
  useCustomerTypeaheadQuery,
} from "@/features/customers/queries/useCustomersQueries";
import {
  useCreateMakeupEventMutation,
  useMakeupArtistsQuery,
  useMakeupEventsQuery,
  useMakeupPackagesQuery,
  useUpdateMakeupEventMutation,
} from "@/features/makeup/queries/useMakeupQueries";
import { makeupStore } from "@/features/makeup/stores/makeupStore";
import { MakeupApiError } from "@/features/makeup/services/makeupClientService";
import type { CustomerTypeaheadItemDto } from "@/types/customersCrm";
import type {
  CreateMakeupEventPayload,
  MakeupEventConflictDto,
  MakeupEventDto,
  MakeupSessionSlot,
  UpdateMakeupEventPayload,
} from "@/types/makeupModule";

interface MakeupCalendarCopy {
  title: string;
  subtitle: string;
  loading: string;
  loadError: string;
  retryAction: string;
  createTitle: string;
  saveAction: string;
  editDrawerTitle: string;
  editDrawerDescription: string;
  editSaveAction: string;
  editCloseAction: string;
  editSuccess: string;
  invalidTimeRange: string;
  invalidPastDate: string;
  invalidSurchargeAmount: string;
  eventDate: string;
  sessionSlot: string;
  startTime: string;
  endTime: string;
  startAt: string;
  endAt: string;
  artist: string;
  customerId: string;
  customerSearchPlaceholder: string;
  customerNoResult: string;
  customerQuickCreateAction: string;
  customerQuickCreateTitle: string;
  customerQuickCreateName: string;
  customerQuickCreatePhone: string;
  customerQuickCreateSubmit: string;
  customerQuickCreateCancel: string;
  customerQuickCreateSuccess: string;
  customerQuickCreateInvalid: string;
  surchargeAmount: string;
  package: string;
  note: string;
  noPackage: string;
  conflictsTitle: string;
  confirmConflictAction: string;
  cancelConflictAction: string;
  successCreate: string;
  conflictHint: string;
  dayConflictBadge: string;
  monthCalendarTitle: string;
  monthPickerLabel: string;
  dayHeaders: string[];
  prevMonthAction: string;
  nextMonthAction: string;
  todayAction: string;
  selectedDayTitle: string;
  noEventsInDay: string;
  moreEventsLabel: string;
}

const COPY: Record<AppLocale, MakeupCalendarCopy> = {
  vi: {
    title: "Lịch makeup",
    subtitle: "Tạo booking và theo dõi lịch theo ngày/giờ.",
    loading: "Đang tải lịch makeup...",
    loadError: "Tải dữ liệu makeup thất bại.",
    retryAction: "Thử lại",
    createTitle: "Tạo booking makeup",
    saveAction: "Lưu lịch",
    editDrawerTitle: "Sửa lịch makeup",
    editDrawerDescription: "Cập nhật thông tin booking đã chọn.",
    editSaveAction: "Lưu cập nhật",
    editCloseAction: "Đóng",
    editSuccess: "Đã cập nhật lịch makeup.",
    invalidTimeRange: "Thời gian bắt đầu/kết thúc không hợp lệ.",
    invalidPastDate: "Không thể đặt lịch vào ngày đã qua.",
    invalidSurchargeAmount: "Phụ phí phải là số không âm.",
    eventDate: "Ngày",
    sessionSlot: "Buổi",
    startTime: "Giờ bắt đầu",
    endTime: "Giờ kết thúc",
    startAt: "Bắt đầu",
    endAt: "Kết thúc",
    artist: "Chuyên viên",
    customerId: "Mã khách hàng",
    customerSearchPlaceholder: "Tìm theo tên hoặc SĐT để chọn khách hàng",
    customerNoResult: "Không tìm thấy khách hàng phù hợp.",
    customerQuickCreateAction: "Tạo nhanh khách hàng",
    customerQuickCreateTitle: "Tạo nhanh khách hàng",
    customerQuickCreateName: "Tên khách hàng",
    customerQuickCreatePhone: "SĐT khách hàng",
    customerQuickCreateSubmit: "Tạo khách hàng",
    customerQuickCreateCancel: "Đóng",
    customerQuickCreateSuccess: "Đã tạo khách hàng và gán vào booking.",
    customerQuickCreateInvalid: "Cần nhập đủ tên và số điện thoại khách hàng.",
    surchargeAmount: "Phụ phí",
    package: "Gói makeup",
    note: "Ghi chú",
    noPackage: "Không chọn gói",
    conflictsTitle: "Cảnh báo trùng lịch",
    confirmConflictAction: "Xác nhận override và lưu",
    cancelConflictAction: "Hủy",
    successCreate: "Đã tạo lịch makeup.",
    conflictHint: "Lịch bị trùng cùng ngày/cùng buổi. Bạn có thể xác nhận override để lưu.",
    dayConflictBadge: "Cảnh báo",
    monthCalendarTitle: "Lịch makeup theo tháng",
    monthPickerLabel: "Chọn tháng",
    dayHeaders: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
    prevMonthAction: "Tháng trước",
    nextMonthAction: "Tháng sau",
    todayAction: "Hôm nay",
    selectedDayTitle: "Lịch trong ngày",
    noEventsInDay: "Không có lịch trong ngày đã chọn.",
    moreEventsLabel: "xem thêm",
  },
  en: {
    title: "Makeup calendar",
    subtitle: "Create bookings and monitor schedule by day/time.",
    loading: "Loading makeup calendar...",
    loadError: "Failed to load makeup data.",
    retryAction: "Retry",
    createTitle: "Create makeup booking",
    saveAction: "Save booking",
    editDrawerTitle: "Edit makeup booking",
    editDrawerDescription: "Update selected booking details.",
    editSaveAction: "Save changes",
    editCloseAction: "Close",
    editSuccess: "Makeup booking updated.",
    invalidTimeRange: "Invalid start/end time.",
    invalidPastDate: "Cannot create booking in a past date.",
    invalidSurchargeAmount: "Surcharge must be a non-negative number.",
    eventDate: "Date",
    sessionSlot: "Session",
    startTime: "Start time",
    endTime: "End time",
    startAt: "Start",
    endAt: "End",
    artist: "Artist",
    customerId: "Customer ID",
    customerSearchPlaceholder: "Search by name or phone",
    customerNoResult: "No matching customers found.",
    customerQuickCreateAction: "Quick create customer",
    customerQuickCreateTitle: "Quick create customer",
    customerQuickCreateName: "Customer name",
    customerQuickCreatePhone: "Customer phone",
    customerQuickCreateSubmit: "Create customer",
    customerQuickCreateCancel: "Close",
    customerQuickCreateSuccess: "Customer created and selected for booking.",
    customerQuickCreateInvalid: "Customer name and phone are required.",
    surchargeAmount: "Surcharge",
    package: "Makeup package",
    note: "Note",
    noPackage: "No package",
    conflictsTitle: "Conflict warning",
    confirmConflictAction: "Confirm override and save",
    cancelConflictAction: "Cancel",
    successCreate: "Makeup booking created.",
    conflictHint: "Schedule conflicts in same day/session. You can confirm override to save.",
    dayConflictBadge: "Warning",
    monthCalendarTitle: "Monthly makeup calendar",
    monthPickerLabel: "Select month",
    dayHeaders: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    prevMonthAction: "Prev month",
    nextMonthAction: "Next month",
    todayAction: "Today",
    selectedDayTitle: "Day bookings",
    noEventsInDay: "No events on selected day.",
    moreEventsLabel: "more",
  },
};

const EMPTY_EVENTS: MakeupEventDto[] = [];

interface MakeupEventEditDraft {
  eventId: string;
  eventDate: string;
  sessionSlot: MakeupSessionSlot;
  startAtLocal: string;
  endAtLocal: string;
  artistProfileId: string;
  customerId: string;
  packageId: string;
  surchargeAmount: string;
  note: string;
}

function toIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(value: Date, days: number): Date {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeekMonday(value: Date): Date {
  const day = value.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  return addDays(value, offset);
}

function endOfWeekSunday(value: Date): Date {
  return addDays(startOfWeekMonday(value), 6);
}

function startOfMonth(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function endOfMonth(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth() + 1, 0);
}

function buildMonthGrid(anchor: Date): string[][] {
  const firstCell = startOfWeekMonday(startOfMonth(anchor));
  const lastCell = endOfWeekSunday(endOfMonth(anchor));
  const weeks: string[][] = [];
  let cursor = new Date(firstCell);

  while (cursor <= lastCell) {
    const week: string[] = [];
    for (let index = 0; index < 7; index += 1) {
      week.push(toIsoDate(cursor));
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }

  return weeks;
}

function parseIsoDate(value: string): Date | null {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function toMonthInputValue(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function parseMonthInput(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;

  const year = Number.parseInt(match[1] ?? "0", 10);
  const month = Number.parseInt(match[2] ?? "0", 10);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
  return new Date(year, month - 1, 1);
}

function formatMonthLabel(anchor: Date, locale: AppLocale): string {
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    month: "long",
    year: "numeric",
  }).format(anchor);
}

function toLocalDateTimeInput(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hour = String(parsed.getHours()).padStart(2, "0");
  const minute = String(parsed.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function toIsoDateTime(value: string): string | null {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function parseNonNegativeAmount(value: string): number | null {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function resolveCalendarErrorMessage(error: unknown, copy: MakeupCalendarCopy): string {
  if (error instanceof MakeupApiError) {
    if (error.message === "INVALID_TIME_RANGE") return copy.invalidTimeRange;
    if (error.message === "INVALID_DATE_RANGE") return copy.invalidPastDate;
    return error.message;
  }
  if (error instanceof Error && error.message.trim()) {
    if (error.message === "INVALID_TIME_RANGE") return copy.invalidTimeRange;
    if (error.message === "INVALID_DATE_RANGE") return copy.invalidPastDate;
    return error.message;
  }
  return copy.loadError;
}

export function useMakeupCalendarPage(locale: AppLocale) {
  const copy = COPY[locale];
  const { currentBranchId, role, profile } = useAuthAccess();
  const isAdminRole = role === "owner_admin" || role === "manager";
  const isMakeupArtistRole = role === "makeup_artist";

  const todayIso = useMemo(() => toIsoDate(new Date()), []);
  const minBookingDateTime = useMemo(() => `${todayIso}T00:00`, [todayIso]);
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [eventDate, setEventDate] = useState(todayIso);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:20");
  const [artistProfileId, setArtistProfileId] = useState("");
  const [calendarArtistProfileId, setCalendarArtistProfileId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [quickCustomerOpen, setQuickCustomerOpen] = useState(false);
  const [quickCustomerName, setQuickCustomerName] = useState("");
  const [quickCustomerPhone, setQuickCustomerPhone] = useState("");
  const [packageId, setPackageId] = useState("");
  const [surchargeAmount, setSurchargeAmount] = useState("0");
  const [note, setNote] = useState("");
  const [pendingConflict, setPendingConflict] = useState<{
    payload: CreateMakeupEventPayload;
    conflicts: MakeupEventConflictDto[];
  } | null>(null);

  const monthGrid = useMemo(() => buildMonthGrid(anchorDate), [anchorDate]);
  const monthLabel = useMemo(() => formatMonthLabel(anchorDate, locale), [anchorDate, locale]);
  const monthInputValue = useMemo(() => toMonthInputValue(anchorDate), [anchorDate]);

  const range = useMemo(
    () => ({
      startDate: monthGrid[0]?.[0] ?? todayIso,
      endDate:
        monthGrid[monthGrid.length - 1]?.[monthGrid[monthGrid.length - 1].length - 1] ?? todayIso,
    }),
    [monthGrid, todayIso]
  );

  const artistsQuery = useMakeupArtistsQuery(currentBranchId, role !== "customer");
  const packagesQuery = useMakeupPackagesQuery({
    branchId: currentBranchId,
    activeOnly: true,
  });
  const customerTypeaheadQuery = useCustomerTypeaheadQuery({
    branchId: currentBranchId,
    search: customerSearch,
    limit: 8,
  });

  const createMutation = useCreateMakeupEventMutation();
  const createCustomerMutation = useCreateCustomerMutation();
  const updateMutation = useUpdateMakeupEventMutation();
  const events = makeupStore.events?.events ?? EMPTY_EVENTS;
  const customerOptions = customerTypeaheadQuery.data?.items ?? [];
  const resolvedArtistProfileId = useMemo(() => {
    if (isMakeupArtistRole && profile?.id) return profile.id;

    const artists = artistsQuery.data?.items ?? [];
    if (artists.length === 0) return "";
    const hasSelectedArtist = artists.some((artist) => artist.profileId === artistProfileId);
    if (hasSelectedArtist) return artistProfileId;
    return artists[0]?.profileId ?? "";
  }, [artistsQuery.data?.items, artistProfileId, isMakeupArtistRole, profile?.id]);

  const resolvedCalendarArtistProfileId = useMemo(() => {
    if (isMakeupArtistRole) return profile?.id ?? "";
    if (!isAdminRole) return "";

    const artists = artistsQuery.data?.items ?? [];
    if (artists.length === 0) return "";
    const hasSelectedArtist = artists.some((artist) => artist.profileId === calendarArtistProfileId);
    if (hasSelectedArtist) return calendarArtistProfileId;
    return artists[0]?.profileId ?? "";
  }, [
    artistsQuery.data?.items,
    calendarArtistProfileId,
    isAdminRole,
    isMakeupArtistRole,
    profile?.id,
  ]);

  const eventsQuery = useMakeupEventsQuery({
    branchId: currentBranchId,
    startDate: range.startDate,
    endDate: range.endDate,
    artistProfileId: resolvedCalendarArtistProfileId || undefined,
  });

  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<MakeupEventEditDraft | null>(null);
  const [editPendingConflict, setEditPendingConflict] = useState<{
    eventId: string;
    payload: UpdateMakeupEventPayload;
    conflicts: MakeupEventConflictDto[];
  } | null>(null);

  const eventsByDate = useMemo(() => {
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
  }, [events]);

  const selectedDateEvents = useMemo(
    () => eventsByDate.get(selectedDate) ?? [],
    [eventsByDate, selectedDate]
  );

  const dayConflictMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const event of events) {
      if (!event.isConflictWarning) continue;
      map.set(event.eventDate, true);
    }
    return map;
  }, [events]);

  const onSelectDate = (date: string) => {
    setSelectedDate(date);
    setEventDate(date);
  };

  const goPrevMonth = () => {
    const next = new Date(anchorDate.getFullYear(), anchorDate.getMonth() - 1, 1);
    setAnchorDate(next);
    onSelectDate(toIsoDate(next));
  };

  const goNextMonth = () => {
    const next = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 1);
    setAnchorDate(next);
    onSelectDate(toIsoDate(next));
  };

  const goToday = () => {
    const now = new Date();
    setAnchorDate(now);
    onSelectDate(toIsoDate(now));
  };

  const onSelectMonth = (value: string) => {
    const parsed = parseMonthInput(value);
    if (!parsed) return;
    setAnchorDate(parsed);
    onSelectDate(toIsoDate(parsed));
  };

  const onCustomerSearchChange = (value: string) => {
    setCustomerSearch(value);
    setCustomerId("");
  };

  const onSelectCustomer = (customer: CustomerTypeaheadItemDto) => {
    setCustomerId(customer.id);
    setCustomerSearch(customer.phone ? `${customer.fullName} • ${customer.phone}` : customer.fullName);
    setQuickCustomerOpen(false);
    setQuickCustomerName("");
    setQuickCustomerPhone("");
  };

  const onToggleQuickCustomer = () => {
    setQuickCustomerOpen((previous) => {
      const next = !previous;
      const maybePhone = customerSearch.replace(/[^\d+]/g, "");
      if (next && !quickCustomerPhone.trim() && maybePhone.length >= 6) {
        setQuickCustomerPhone(maybePhone);
      }
      return next;
    });
  };

  const onCreateQuickCustomer = async () => {
    const fullName = quickCustomerName.trim();
    const phone = quickCustomerPhone.trim();

    if (!currentBranchId || !fullName || !phone) {
      toast.error(copy.customerQuickCreateInvalid);
      return;
    }

    try {
      const detail = await createCustomerMutation.mutateAsync({
        branchId: currentBranchId,
        fullName,
        phone,
      });
      setCustomerId(detail.customer.id);
      setCustomerSearch(
        detail.customer.phone ? `${detail.customer.fullName} • ${detail.customer.phone}` : detail.customer.fullName
      );
      setQuickCustomerOpen(false);
      setQuickCustomerName("");
      setQuickCustomerPhone("");
      toast.success(copy.customerQuickCreateSuccess);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.loadError);
    }
  };

  const submitCreate = async (payload: CreateMakeupEventPayload) => {
    try {
      await createMutation.mutateAsync(payload);
      toast.success(copy.successCreate);
      setPendingConflict(null);
      onSelectDate(payload.eventDate);
      const payloadDate = parseIsoDate(payload.eventDate);
      if (payloadDate) {
        setAnchorDate(new Date(payloadDate.getFullYear(), payloadDate.getMonth(), 1));
      }
    } catch (error) {
      if (
        error instanceof MakeupApiError &&
        error.message === "CONFLICT_WARNING_REQUIRED" &&
        Array.isArray(error.context?.conflicts)
      ) {
        setPendingConflict({
          payload,
          conflicts: error.context.conflicts as MakeupEventConflictDto[],
        });
        return;
      }

      toast.error(resolveCalendarErrorMessage(error, copy));
    }
  };

  const onCreateEvent = async () => {
    if (eventDate < todayIso) {
      toast.error(copy.invalidPastDate);
      return;
    }
    const startAt = toIsoDateTime(`${eventDate}T${startTime}`);
    const endAt = toIsoDateTime(`${eventDate}T${endTime}`);
    const parsedSurchargeAmount = parseNonNegativeAmount(surchargeAmount);
    if (!startAt || !endAt || endAt <= startAt) {
      toast.error(copy.invalidTimeRange);
      return;
    }
    if (parsedSurchargeAmount === null) {
      toast.error(copy.invalidSurchargeAmount);
      return;
    }

    await submitCreate({
      branchId: currentBranchId,
      eventDate,
      startAt,
      endAt,
      artistProfileId: resolvedArtistProfileId || null,
      customerId: customerId || null,
      packageId: packageId || null,
      surchargeAmount: parsedSurchargeAmount,
      note: note || null,
    });
  };

  const onConfirmConflictOverride = async () => {
    if (!pendingConflict) return;
    await submitCreate({
      ...pendingConflict.payload,
      confirmConflictOverride: true,
    });
  };

  const onCancelConflict = () => {
    setPendingConflict(null);
  };

  const onOpenEditEvent = (event: MakeupEventDto) => {
    setEditDraft({
      eventId: event.id,
      eventDate: event.eventDate,
      sessionSlot: event.sessionSlot,
      startAtLocal: toLocalDateTimeInput(event.startAt),
      endAtLocal: toLocalDateTimeInput(event.endAt),
      artistProfileId: event.artistProfileId,
      customerId: event.customerId ?? "",
      packageId: event.packageId ?? "",
      surchargeAmount: String(event.surchargeAmount),
      note: event.note ?? "",
    });
    setEditPendingConflict(null);
    setEditDrawerOpen(true);
  };

  const onCloseEditDrawer = () => {
    setEditDrawerOpen(false);
    setEditPendingConflict(null);
  };

  const onEditDraftChange = (field: keyof MakeupEventEditDraft, value: string) => {
    setEditDraft((previous) =>
      previous
        ? {
            ...previous,
            [field]: value,
          }
        : previous
    );
  };

  const buildEditPayload = (): { eventId: string; payload: UpdateMakeupEventPayload } | null => {
    if (!editDraft) return null;
    if (editDraft.eventDate < todayIso) {
      toast.error(copy.invalidPastDate);
      return null;
    }

    const startAt = toIsoDateTime(editDraft.startAtLocal);
    const endAt = toIsoDateTime(editDraft.endAtLocal);
    const parsedSurchargeAmount = parseNonNegativeAmount(editDraft.surchargeAmount);
    if (!startAt || !endAt || endAt <= startAt) {
      toast.error(copy.invalidTimeRange);
      return null;
    }
    if (parsedSurchargeAmount === null) {
      toast.error(copy.invalidSurchargeAmount);
      return null;
    }

    return {
      eventId: editDraft.eventId,
      payload: {
        eventDate: editDraft.eventDate,
        sessionSlot: editDraft.sessionSlot,
        startAt,
        endAt,
        artistProfileId: editDraft.artistProfileId,
        customerId: editDraft.customerId || null,
        packageId: editDraft.packageId || null,
        surchargeAmount: parsedSurchargeAmount,
        note: editDraft.note || null,
      },
    };
  };

  const submitEdit = async (confirmConflictOverride: boolean): Promise<boolean> => {
    const draftPayload = buildEditPayload();
    if (!draftPayload) return false;

    try {
      await updateMutation.mutateAsync({
        eventId: draftPayload.eventId,
        payload: {
          ...draftPayload.payload,
          confirmConflictOverride,
        },
      });
      toast.success(copy.editSuccess);
      setEditPendingConflict(null);
      onCloseEditDrawer();
      const payloadDate = parseIsoDate(draftPayload.payload.eventDate ?? "");
      if (payloadDate) {
        setAnchorDate(new Date(payloadDate.getFullYear(), payloadDate.getMonth(), 1));
      }
      onSelectDate(draftPayload.payload.eventDate ?? selectedDate);
      return true;
    } catch (error) {
      if (
        error instanceof MakeupApiError &&
        error.message === "CONFLICT_WARNING_REQUIRED" &&
        Array.isArray(error.context?.conflicts)
      ) {
        setEditPendingConflict({
          eventId: draftPayload.eventId,
          payload: draftPayload.payload,
          conflicts: error.context.conflicts as MakeupEventConflictDto[],
        });
        return false;
      }

      toast.error(resolveCalendarErrorMessage(error, copy));
      return false;
    }
  };

  return {
    copy,
    role,
    range,
    eventDate,
    setEventDate,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    artistProfileId: resolvedArtistProfileId,
    setArtistProfileId,
    calendarArtistProfileId: resolvedCalendarArtistProfileId,
    setCalendarArtistProfileId,
    canSelectCalendarArtist: isAdminRole,
    isCalendarArtistLocked: isMakeupArtistRole,
    customerId,
    customerSearch,
    onCustomerSearchChange,
    customerTypeaheadQuery,
    customerOptions,
    onSelectCustomer,
    quickCustomerOpen,
    onToggleQuickCustomer,
    quickCustomerName,
    setQuickCustomerName,
    quickCustomerPhone,
    setQuickCustomerPhone,
    onCreateQuickCustomer,
    createCustomerMutation,
    packageId,
    setPackageId,
    surchargeAmount,
    setSurchargeAmount,
    note,
    setNote,
    eventsQuery,
    artistsQuery,
    packagesQuery,
    createMutation,
    updateMutation,
    events,
    eventsByDate,
    todayIso,
    minBookingDateTime,
    selectedDate,
    selectedDateEvents,
    dayConflictMap,
    monthGrid,
    monthLabel,
    monthInputValue,
    anchorDate,
    pendingConflict,
    onSelectDate,
    onSelectMonth,
    goPrevMonth,
    goNextMonth,
    goToday,
    onCreateEvent,
    onConfirmConflictOverride,
    onCancelConflict,
    editDrawerOpen,
    editDraft,
    editPendingConflict,
    onOpenEditEvent,
    onCloseEditDrawer,
    onEditDraftChange,
    onSaveEdit: () => submitEdit(false),
    onConfirmEditOverride: () => submitEdit(true),
  };
}

export type MakeupCalendarPageModel = ReturnType<typeof useMakeupCalendarPage>;
