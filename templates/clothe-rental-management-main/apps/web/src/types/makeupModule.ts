export type MakeupSessionSlot = "MORNING" | "AFTERNOON" | "EVENING";
export type MakeupBookingInputMode = "VOICE" | "TEXT";

export type MakeupEventStatus = "BOOKED" | "COMPLETED" | "CANCELLED";

export interface MakeupEventDto {
  id: string;
  branchId: string;
  eventDate: string;
  sessionSlot: MakeupSessionSlot;
  artistProfileId: string;
  artistName: string | null;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  packageId: string | null;
  packageCode: string | null;
  packageName: string | null;
  guestCount: number;
  durationMinutes: number;
  startAt: string;
  endAt: string;
  status: MakeupEventStatus;
  note: string | null;
  priceAmount: number;
  surchargeAmount: number;
  costAmount: number;
  isConflictWarning: boolean;
  conflictNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export type MakeupConflictReason =
  | "ARTIST_SLOT_CONFLICT"
  | "CUSTOMER_SLOT_CONFLICT";

export interface MakeupEventConflictDto {
  eventId: string;
  eventDate: string;
  sessionSlot: MakeupSessionSlot;
  artistProfileId: string;
  artistName: string | null;
  customerId: string | null;
  customerName: string | null;
  reason: MakeupConflictReason;
}

export interface MakeupEventsQuery {
  branchId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  artistProfileId?: string | null;
  customerId?: string | null;
}

export interface MakeupEventsResponse {
  branchId: string;
  timezone: string;
  moduleEnabled: boolean;
  events: MakeupEventDto[];
}

export interface MakeupEventMutationResponse {
  event: MakeupEventDto;
  conflicts: MakeupEventConflictDto[];
  warningAcknowledged: boolean;
}

export interface CreateMakeupEventPayload {
  branchId?: string | null;
  eventDate: string;
  sessionSlot?: MakeupSessionSlot;
  startAt?: string | null;
  endAt?: string | null;
  artistProfileId?: string | null;
  requestAsPublic?: boolean;
  customerId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  guestCount?: number | null;
  durationMinutes?: number | null;
  packageId?: string | null;
  status?: MakeupEventStatus;
  note?: string | null;
  priceAmount?: number | null;
  surchargeAmount?: number | null;
  costAmount?: number | null;
  sourceInputMode?: MakeupBookingInputMode | null;
  sourceInputText?: string | null;
  confirmConflictOverride?: boolean;
}

export interface UpdateMakeupEventPayload {
  eventDate?: string;
  sessionSlot?: MakeupSessionSlot;
  startAt?: string | null;
  endAt?: string | null;
  artistProfileId?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  guestCount?: number | null;
  durationMinutes?: number | null;
  packageId?: string | null;
  status?: MakeupEventStatus;
  note?: string | null;
  priceAmount?: number | null;
  surchargeAmount?: number | null;
  costAmount?: number | null;
  sourceInputMode?: MakeupBookingInputMode | null;
  sourceInputText?: string | null;
  confirmConflictOverride?: boolean;
}

export interface CheckMakeupConflictsQuery {
  branchId?: string | null;
  eventDate: string;
  sessionSlot?: MakeupSessionSlot;
  startAt?: string | null;
  endAt?: string | null;
  artistProfileId?: string | null;
  customerId?: string | null;
  customerPhone?: string | null;
  excludeEventId?: string | null;
}

export interface MakeupConflictsResponse {
  branchId: string;
  timezone: string;
  conflicts: MakeupEventConflictDto[];
}

export interface MakeupArtistDto {
  profileId: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  defaultBranchId: string | null;
  branchIds: string[];
}

export interface MakeupArtistsResponse {
  branchId: string;
  items: MakeupArtistDto[];
}

export interface MakeupArtistScheduleQuery {
  branchId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface MakeupPackageDto {
  id: string;
  branchId: string;
  code: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  priceAmount: number;
  costAmount: number;
  isActive: boolean;
  createdByProfileId: string | null;
  updatedByProfileId: string | null;
  updatedAt: string;
}

export interface MakeupPackagesQuery {
  branchId?: string | null;
  activeOnly?: boolean;
}

export interface MakeupPackagesResponse {
  branchId: string;
  moduleEnabled: boolean;
  items: MakeupPackageDto[];
}

export interface CreateMakeupPackagePayload {
  branchId?: string | null;
  code: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  priceAmount: number;
  costAmount: number;
  isActive?: boolean;
}

export interface UpdateMakeupPackagePayload {
  code?: string;
  name?: string;
  description?: string | null;
  durationMinutes?: number;
  priceAmount?: number;
  costAmount?: number;
  isActive?: boolean;
}

export interface MakeupMyStatsQuery {
  branchId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface MakeupMyStatsResponse {
  branchId: string;
  timezone: string;
  artistProfileId: string;
  startDate: string;
  endDate: string;
  revenue: number;
  cost: number;
  profit: number;
  eventCount: number;
  completedEventCount: number;
  cancelledEventCount: number;
  conflictEventCount: number;
}

export interface MakeupModuleMetricDto {
  revenue: number;
  profit: number;
  orderCount: number;
}

export interface ParseMakeupBookingInputPayload {
  inputMode: MakeupBookingInputMode;
  inputText: string;
  referenceDate?: string | null;
}

export interface MakeupParsedBookingDraft {
  inputMode: MakeupBookingInputMode;
  rawInput: string;
  guestCount?: number | null;
  bookingDate?: string | null;
  bookingTime?: string | null;
  sessionSlot?: MakeupSessionSlot | null;
  startAt?: string | null;
  endAt?: string | null;
  durationMinutes?: number | null;
  customerName: string;
  customerPhone: string;
  note?: string | null;
  parseWarnings: string[];
}

export interface MakeupInventoryItemDto {
  id: string;
  branchId: string;
  name: string;
  category: string | null;
  packageId: string;
  packageCode: string | null;
  packageName: string | null;
  artistProfileId: string;
  artistName: string | null;
  shopeeUrl: string | null;
  note: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MakeupInventoryQuery {
  branchId?: string | null;
  packageId?: string | null;
  artistProfileId?: string | null;
  isActive?: boolean | null;
  search?: string | null;
}

export interface MakeupInventoryResponse {
  branchId: string;
  items: MakeupInventoryItemDto[];
}

export interface CreateMakeupInventoryItemPayload {
  branchId?: string | null;
  name: string;
  category?: string | null;
  packageId: string;
  artistProfileId: string;
  shopeeUrl?: string | null;
  note?: string | null;
  isActive?: boolean;
}

export interface UpdateMakeupInventoryItemPayload {
  name?: string;
  category?: string | null;
  packageId?: string;
  artistProfileId?: string;
  shopeeUrl?: string | null;
  note?: string | null;
  isActive?: boolean;
}

export interface MakeupOrdersQuery {
  branchId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: MakeupEventStatus | null;
  search?: string | null;
}

export interface MakeupOrdersResponse {
  branchId: string;
  timezone: string;
  items: MakeupEventDto[];
}

export type CreateMakeupOrderPayload = CreateMakeupEventPayload;
export type UpdateMakeupOrderPayload = UpdateMakeupEventPayload;

export type MakeupPurchaseInvoiceStatus =
  | "DRAFT"
  | "CONFIRMED"
  | "PAID"
  | "CANCELLED";

export interface MakeupPurchaseInvoiceItemDto {
  id: string;
  invoiceId: string;
  inventoryItemId: string | null;
  itemName: string;
  quantity: number;
  unitCostAmount: number;
  lineTotalAmount: number;
  note: string | null;
}

export interface MakeupPurchaseInvoiceDto {
  id: string;
  branchId: string;
  invoiceCode: string;
  invoiceDate: string;
  status: MakeupPurchaseInvoiceStatus;
  supplierName: string | null;
  supplierPhone: string | null;
  note: string | null;
  totalAmount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  items: MakeupPurchaseInvoiceItemDto[];
}

export interface MakeupPurchaseInvoicesQuery {
  branchId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: MakeupPurchaseInvoiceStatus | null;
  search?: string | null;
}

export interface MakeupPurchaseInvoicesResponse {
  branchId: string;
  items: MakeupPurchaseInvoiceDto[];
}

export interface MakeupPurchaseInvoiceInputItemPayload {
  inventoryItemId?: string | null;
  itemName: string;
  quantity: number;
  unitCostAmount: number;
  note?: string | null;
}

export interface CreateMakeupPurchaseInvoicePayload {
  branchId?: string | null;
  invoiceDate: string;
  status?: MakeupPurchaseInvoiceStatus;
  supplierName?: string | null;
  supplierPhone?: string | null;
  note?: string | null;
  isActive?: boolean;
  items?: MakeupPurchaseInvoiceInputItemPayload[];
}

export interface UpdateMakeupPurchaseInvoicePayload {
  invoiceDate?: string;
  status?: MakeupPurchaseInvoiceStatus;
  supplierName?: string | null;
  supplierPhone?: string | null;
  note?: string | null;
  isActive?: boolean;
  items?: MakeupPurchaseInvoiceInputItemPayload[];
}

export interface MakeupAdminOverviewQuery {
  branchId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  granularity?: "day" | "month";
}

export interface MakeupAdminOverviewChartPointDto {
  bucket: string;
  label: string;
  revenue: number;
  cost: number;
  profit: number;
  makeupOrderCount: number;
  makeupPurchaseInvoiceCount: number;
}

export interface MakeupAdminOverviewResponse {
  branchId: string;
  timezone: string;
  startDate: string;
  endDate: string;
  makeupOrderCount: number;
  makeupPurchaseInvoiceCount: number;
  revenue: number;
  cost: number;
  profit: number;
  chart: MakeupAdminOverviewChartPointDto[];
}
