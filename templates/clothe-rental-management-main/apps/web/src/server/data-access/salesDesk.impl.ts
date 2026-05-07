import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CloseSalesShiftPayload,
  OpenSalesShiftPayload,
  SalesShiftDetailDto,
  SalesShiftListQuery,
  SalesShiftListResponse,
  SalesShiftOrderSnapshotDto,
  SalesShiftReconciliationDto,
  SalesShiftSessionSummaryDto,
  SalesShiftDto,
} from "@/types/salesDesk";

const SALES_ROLE_SET = new Set(["owner_admin", "admin", "manager", "staff"]);
const OWNER_ADMIN_ROLE_SET = new Set(["owner_admin", "admin"]);
const SHIFT_MANAGEMENT_ROLE_SET = new Set(["owner_admin", "admin", "manager"]);
const SHIFT_STATUS_OPEN = "OPEN";
const SHIFT_STATUS_CLOSED = "CLOSED";
const ORDER_STATUS_CANCELLED = "CANCELLED";
const DEFAULT_SHIFT_LIST_PAGE_SIZE = 20;
const MAX_SHIFT_LIST_PAGE_SIZE = 100;

const SALES_SHIFT_SELECT =
  "id, branch_id, opened_by, opened_at, opening_cash, status, closed_by, closed_at, closing_cash, note, created_by, updated_by, created_at, updated_at";

type SalesDeskErrorCode =
  | "MISSING_PROFILE_CONTEXT"
  | "FORBIDDEN_SALES_ACCESS"
  | "FORBIDDEN_SHIFT_MANAGEMENT"
  | "MISSING_BRANCH_CONTEXT"
  | "BRANCH_ACCESS_DENIED"
  | "INVALID_CASH_AMOUNT"
  | "SHIFT_ALREADY_OPEN"
  | "SHIFT_NOT_FOUND"
  | "SHIFT_ALREADY_CLOSED"
  | "SHIFT_VARIANCE_NOTE_REQUIRED";

interface SalesDeskErrorContext {
  [key: string]: unknown;
}

export class SalesDeskDomainError extends Error {
  readonly code: SalesDeskErrorCode;
  readonly context: SalesDeskErrorContext;

  constructor(code: SalesDeskErrorCode, context: SalesDeskErrorContext = {}) {
    super(code);
    this.name = "SalesDeskDomainError";
    this.code = code;
    this.context = context;
  }
}

interface ProfileRow {
  id: string;
  role: string | null;
  default_branch_id: string | null;
}

interface BranchAccessRow {
  branch_id: string;
}

interface BranchRow {
  id: string;
}

interface SalesShiftRow {
  id: string;
  branch_id: string;
  opened_by: string;
  opened_at: string;
  opening_cash: number | string | null;
  status: string;
  closed_by: string | null;
  closed_at: string | null;
  closing_cash: number | string | null;
  note: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

interface ShiftCashPaymentRow {
  type: string;
  method: string | null;
  amount: number | string | null;
}

interface ProfileNameRow {
  id: string;
  full_name: string | null;
}

interface ShiftOrderRow {
  id: string;
  order_code: string;
  order_type: string | null;
  status: string | null;
  customer_id: string;
  total_amount: number | string | null;
  deposit_amount: number | string | null;
  created_at: string;
}

interface ShiftCustomerRow {
  id: string;
  full_name: string | null;
  phone: string | null;
}

function parseNumeric(value: number | string | null | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return 0;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value;
}

function sanitizeText(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeRole(role: string | null | undefined): string | null {
  if (typeof role !== "string") return null;
  const normalized = role.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function resolveSignedCashAmount(type: string, amount: number): number {
  const normalizedType = type.trim().toUpperCase();
  if (normalizedType === "REFUND" || normalizedType === "EXPENSE") {
    return -Math.abs(amount);
  }
  return Math.abs(amount);
}

function buildEmptyReconciliation(openingCash: number): SalesShiftReconciliationDto {
  return {
    cashPaymentCount: 0,
    cashInflow: 0,
    cashRefund: 0,
    cashNetMovement: 0,
    expectedClosingCash: roundMoney(openingCash),
    variance: null,
  };
}

async function computeShiftReconciliation(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    openedBy: string;
    openingCash: number;
    openedAt: string;
    closedAt?: string | null;
    closingCash?: number | null;
  }
): Promise<SalesShiftReconciliationDto> {
  const toTimestamp = sanitizeText(options.closedAt) ?? new Date().toISOString();

  const { data, error } = await supabase
    .from("payments")
    .select("type, method, amount")
    .eq("branch_id", options.branchId)
    .eq("created_by", options.openedBy)
    .eq("status", "POSTED")
    .eq("method", "CASH")
    .gte("created_at", options.openedAt)
    .lte("created_at", toTimestamp)
    .returns<ShiftCashPaymentRow[]>();

  if (error) throw error;

  const reconciliation = buildEmptyReconciliation(options.openingCash);
  for (const row of data ?? []) {
    const amount = roundMoney(Math.max(0, parseNumeric(row.amount)));
    if (amount <= 0) continue;

    const signedAmount = resolveSignedCashAmount(row.type, amount);
    reconciliation.cashPaymentCount += 1;
    reconciliation.cashNetMovement = roundMoney(
      reconciliation.cashNetMovement + signedAmount
    );

    if (signedAmount < 0) {
      reconciliation.cashRefund = roundMoney(
        reconciliation.cashRefund + Math.abs(signedAmount)
      );
    } else {
      reconciliation.cashInflow = roundMoney(
        reconciliation.cashInflow + signedAmount
      );
    }
  }

  reconciliation.expectedClosingCash = roundMoney(
    options.openingCash + reconciliation.cashNetMovement
  );

  if (typeof options.closingCash === "number") {
    reconciliation.variance = roundMoney(
      options.closingCash - reconciliation.expectedClosingCash
    );
  }

  return reconciliation;
}

function resolveShiftWindowToTimestamp(shift: SalesShiftRow): string {
  return sanitizeText(shift.closed_at) ?? new Date().toISOString();
}

function toIsoStartOfDay(input: string | null | undefined): string | null {
  const raw = sanitizeText(input);
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  return `${raw}T00:00:00.000Z`;
}

function toIsoEndOfDay(input: string | null | undefined): string | null {
  const raw = sanitizeText(input);
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  return `${raw}T23:59:59.999Z`;
}

function normalizeShiftOrderType(value: string | null | undefined): "RENTAL" | "SALE" {
  return value?.trim().toUpperCase() === "SALE" ? "SALE" : "RENTAL";
}

function normalizeShiftOrderStatus(
  value: string | null | undefined
): SalesShiftOrderSnapshotDto["status"] {
  const normalized = value?.trim().toUpperCase();
  if (
    normalized === "DRAFT" ||
    normalized === "RESERVED" ||
    normalized === "CONFIRMED" ||
    normalized === "PICKED_UP" ||
    normalized === "RETURNED" ||
    normalized === "DEBT" ||
    normalized === "COMPLETED" ||
    normalized === "CANCELLED"
  ) {
    return normalized;
  }

  return "DRAFT";
}

function mapSalesShiftRow(
  row: SalesShiftRow,
  reconciliation: SalesShiftReconciliationDto | null,
  options?: {
    profileNameMap?: Map<string, string | null>;
  }
): SalesShiftDto {
  const profileNameMap = options?.profileNameMap;
  return {
    id: row.id,
    branchId: row.branch_id,
    openedBy: row.opened_by,
    openedByName: profileNameMap?.get(row.opened_by) ?? null,
    openedAt: row.opened_at,
    openingCash: roundMoney(parseNumeric(row.opening_cash)),
    status: row.status === SHIFT_STATUS_CLOSED ? SHIFT_STATUS_CLOSED : SHIFT_STATUS_OPEN,
    closedBy: row.closed_by,
    closedByName: row.closed_by ? profileNameMap?.get(row.closed_by) ?? null : null,
    closedAt: row.closed_at,
    closingCash:
      row.closing_cash === null ? null : roundMoney(parseNumeric(row.closing_cash)),
    note: row.note,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reconciliation,
  };
}

async function buildProfileNameMap(
  supabase: SupabaseClient,
  profileIds: string[]
): Promise<Map<string, string | null>> {
  const normalizedIds = Array.from(new Set(profileIds.filter(Boolean)));
  if (normalizedIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", normalizedIds)
    .returns<ProfileNameRow[]>();

  if (error) throw error;

  const map = new Map<string, string | null>();
  for (const profile of data ?? []) {
    map.set(profile.id, sanitizeText(profile.full_name));
  }

  return map;
}

async function fetchShiftOrders(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    openedBy: string;
    fromTimestamp: string;
    toTimestamp: string;
  }
): Promise<SalesShiftOrderSnapshotDto[]> {
  const { data: orderRows, error: orderError } = await supabase
    .from("rental_orders")
    .select(
      "id, order_code, order_type, status, customer_id, total_amount, deposit_amount, created_at"
    )
    .eq("branch_id", options.branchId)
    .eq("created_by", options.openedBy)
    .gte("created_at", options.fromTimestamp)
    .lte("created_at", options.toTimestamp)
    .order("created_at", { ascending: false })
    .returns<ShiftOrderRow[]>();

  if (orderError) throw orderError;

  const customerIds = Array.from(
    new Set((orderRows ?? []).map((entry) => entry.customer_id).filter(Boolean))
  );
  const customerMap = new Map<string, ShiftCustomerRow>();

  if (customerIds.length > 0) {
    const { data: customerRows, error: customerError } = await supabase
      .from("customers")
      .select("id, full_name, phone")
      .in("id", customerIds)
      .returns<ShiftCustomerRow[]>();

    if (customerError) throw customerError;

    for (const customer of customerRows ?? []) {
      customerMap.set(customer.id, customer);
    }
  }

  return (orderRows ?? []).map((entry) => {
    const customer = customerMap.get(entry.customer_id);
    return {
      orderId: entry.id,
      orderCode: entry.order_code,
      orderType: normalizeShiftOrderType(entry.order_type),
      status: normalizeShiftOrderStatus(entry.status),
      customerId: entry.customer_id,
      customerName: sanitizeText(customer?.full_name),
      customerPhone: sanitizeText(customer?.phone),
      totalAmount: roundMoney(Math.max(0, parseNumeric(entry.total_amount))),
      depositAmount: roundMoney(Math.max(0, parseNumeric(entry.deposit_amount))),
      createdAt: entry.created_at,
    };
  });
}

async function computeShiftSessionSummary(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    openedBy: string;
    fromTimestamp: string;
    toTimestamp: string;
    orders: SalesShiftOrderSnapshotDto[];
  }
): Promise<SalesShiftSessionSummaryDto> {
  let totalRentalAmount = 0;
  let totalSaleAmount = 0;

  for (const order of options.orders) {
    if (order.status === ORDER_STATUS_CANCELLED) continue;
    if (order.orderType === "SALE") {
      totalSaleAmount = roundMoney(totalSaleAmount + order.totalAmount);
      continue;
    }
    totalRentalAmount = roundMoney(totalRentalAmount + order.totalAmount);
  }

  const { data: paymentRows, error: paymentError } = await supabase
    .from("payments")
    .select("type, method, amount")
    .eq("branch_id", options.branchId)
    .eq("created_by", options.openedBy)
    .eq("status", "POSTED")
    .gte("created_at", options.fromTimestamp)
    .lte("created_at", options.toTimestamp)
    .returns<ShiftCashPaymentRow[]>();

  if (paymentError) throw paymentError;

  let totalReceivedAmount = 0;
  let totalDepositAmount = 0;
  for (const payment of paymentRows ?? []) {
    const amount = roundMoney(Math.max(0, parseNumeric(payment.amount)));
    if (amount <= 0) continue;
    const type = payment.type.trim().toUpperCase();
    if (type === "REFUND") continue;

    totalReceivedAmount = roundMoney(totalReceivedAmount + amount);
    if (type === "DEPOSIT") {
      totalDepositAmount = roundMoney(totalDepositAmount + amount);
    }
  }

  return {
    orderCount: options.orders.length,
    totalReceivedAmount,
    totalDepositAmount,
    totalRentalAmount,
    totalSaleAmount,
  };
}

async function buildShiftDetail(
  supabase: SupabaseClient,
  options: {
    shift: SalesShiftRow;
    profileNameMap?: Map<string, string | null>;
  }
): Promise<SalesShiftDetailDto> {
  const fromTimestamp = options.shift.opened_at;
  const toTimestamp = resolveShiftWindowToTimestamp(options.shift);
  const openingCash = roundMoney(parseNumeric(options.shift.opening_cash));

  const reconciliation = await computeShiftReconciliation(supabase, {
    branchId: options.shift.branch_id,
    openedBy: options.shift.opened_by,
    openingCash,
    openedAt: fromTimestamp,
    closedAt: options.shift.closed_at,
    closingCash:
      options.shift.closing_cash === null
        ? null
        : roundMoney(parseNumeric(options.shift.closing_cash)),
  });

  const orders = await fetchShiftOrders(supabase, {
    branchId: options.shift.branch_id,
    openedBy: options.shift.opened_by,
    fromTimestamp,
    toTimestamp,
  });

  const summary = await computeShiftSessionSummary(supabase, {
    branchId: options.shift.branch_id,
    openedBy: options.shift.opened_by,
    fromTimestamp,
    toTimestamp,
    orders,
  });

  return {
    ...mapSalesShiftRow(options.shift, reconciliation, {
      profileNameMap: options.profileNameMap,
    }),
    summary,
    orders,
  };
}

function assertCashAmount(value: number, field: "openingCash" | "closingCash"): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new SalesDeskDomainError("INVALID_CASH_AMOUNT", {
      field,
      value,
    });
  }

  return roundMoney(value);
}

async function fetchActorProfile(
  supabase: SupabaseClient,
  actorProfileId: string
): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, default_branch_id")
    .eq("id", actorProfileId)
    .eq("is_active", true)
    .maybeSingle<ProfileRow>();

  if (error) throw error;
  return data ?? null;
}

async function assertSalesActor(
  supabase: SupabaseClient,
  actorProfileId: string
): Promise<ProfileRow> {
  const actor = await fetchActorProfile(supabase, actorProfileId);
  if (!actor) {
    throw new SalesDeskDomainError("MISSING_PROFILE_CONTEXT", {
      actorProfileId,
    });
  }

  const role = normalizeRole(actor.role);
  if (!role || !SALES_ROLE_SET.has(role)) {
    throw new SalesDeskDomainError("FORBIDDEN_SALES_ACCESS", {
      actorProfileId,
      role: actor.role,
    });
  }

  return actor;
}

function assertShiftManagementRole(actor: ProfileRow): void {
  const role = normalizeRole(actor.role);
  if (!role || !SHIFT_MANAGEMENT_ROLE_SET.has(role)) {
    throw new SalesDeskDomainError("FORBIDDEN_SHIFT_MANAGEMENT", {
      actorProfileId: actor.id,
      role: actor.role,
    });
  }
}

async function resolveActorBranchId(
  supabase: SupabaseClient,
  actor: ProfileRow,
  requestedBranchId: string | null | undefined
): Promise<string> {
  const branchId = sanitizeText(requestedBranchId) ?? sanitizeText(actor.default_branch_id);
  if (!branchId) {
    throw new SalesDeskDomainError("MISSING_BRANCH_CONTEXT", {
      actorProfileId: actor.id,
    });
  }

  const role = normalizeRole(actor.role);
  if (role && OWNER_ADMIN_ROLE_SET.has(role)) {
    const { data, error } = await supabase
      .from("branches")
      .select("id")
      .eq("id", branchId)
      .maybeSingle<BranchRow>();

    if (error) throw error;
    if (!data) {
      throw new SalesDeskDomainError("BRANCH_ACCESS_DENIED", {
        actorProfileId: actor.id,
        branchId,
      });
    }

    return branchId;
  }

  const { data, error } = await supabase
    .from("profile_branch_access")
    .select("branch_id")
    .eq("profile_id", actor.id)
    .eq("branch_id", branchId)
    .eq("is_delete", false)
    .maybeSingle<BranchAccessRow>();

  if (error) throw error;
  if (!data) {
    throw new SalesDeskDomainError("BRANCH_ACCESS_DENIED", {
      actorProfileId: actor.id,
      branchId,
    });
  }

  return branchId;
}

async function fetchOpenShiftByBranchActor(
  supabase: SupabaseClient,
  actorProfileId: string,
  branchId: string
): Promise<SalesShiftRow | null> {
  const { data, error } = await supabase
    .from("sales_shifts")
    .select(SALES_SHIFT_SELECT)
    .eq("opened_by", actorProfileId)
    .eq("branch_id", branchId)
    .eq("status", SHIFT_STATUS_OPEN)
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle<SalesShiftRow>();

  if (error) throw error;
  return data ?? null;
}

async function writeShiftAuditEvent(
  supabase: SupabaseClient,
  options: {
    branchId: string;
    actorProfileId: string;
    shift: SalesShiftDto;
    reconciliation: SalesShiftReconciliationDto | null;
    action: "SHIFT_OPENED" | "SHIFT_CLOSED";
    reason?: string | null;
  }
): Promise<void> {
  const payload = {
    branch_id: options.branchId,
    actor_profile_id: options.actorProfileId,
    entity_type: "sales_shift",
    entity_id: options.shift.id,
    action: options.action,
    reason: sanitizeText(options.reason),
    after_data: {
      shiftId: options.shift.id,
      status: options.shift.status,
      openingCash: options.shift.openingCash,
      closingCash: options.shift.closingCash,
      openedAt: options.shift.openedAt,
      closedAt: options.shift.closedAt,
      expectedClosingCash: options.reconciliation?.expectedClosingCash ?? null,
      cashNetMovement: options.reconciliation?.cashNetMovement ?? null,
      cashInflow: options.reconciliation?.cashInflow ?? null,
      cashRefund: options.reconciliation?.cashRefund ?? null,
      variance: options.reconciliation?.variance ?? null,
    },
    meta: {
      source: "sales-desk",
    },
  };

  const { error } = await supabase.from("audit_events").insert(payload);
  if (error) throw error;
}

export async function getCurrentSalesShiftForActor(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    branchId?: string | null;
  }
): Promise<SalesShiftDto | null> {
  const actor = await assertSalesActor(supabase, options.actorProfileId);
  const branchId = await resolveActorBranchId(supabase, actor, options.branchId);
  const openShift = await fetchOpenShiftByBranchActor(
    supabase,
    options.actorProfileId,
    branchId
  );

  if (!openShift) return null;

  const openingCash = roundMoney(parseNumeric(openShift.opening_cash));
  const reconciliation = await computeShiftReconciliation(supabase, {
    branchId,
    openedBy: options.actorProfileId,
    openingCash,
    openedAt: openShift.opened_at,
  });

  return mapSalesShiftRow(openShift, reconciliation);
}

export async function getCurrentSalesShiftDetailForActor(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    branchId?: string | null;
  }
): Promise<SalesShiftDetailDto | null> {
  const actor = await assertSalesActor(supabase, options.actorProfileId);
  const branchId = await resolveActorBranchId(supabase, actor, options.branchId);
  const openShift = await fetchOpenShiftByBranchActor(
    supabase,
    options.actorProfileId,
    branchId
  );

  if (!openShift) return null;

  const profileNameMap = await buildProfileNameMap(supabase, [
    openShift.opened_by,
    openShift.closed_by ?? "",
  ]);

  return buildShiftDetail(supabase, {
    shift: openShift,
    profileNameMap,
  });
}

export async function openSalesShiftForActor(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    payload: OpenSalesShiftPayload;
  }
): Promise<SalesShiftDto> {
  const actor = await assertSalesActor(supabase, options.actorProfileId);
  const branchId = await resolveActorBranchId(
    supabase,
    actor,
    options.payload.branchId
  );
  const openingCash = assertCashAmount(options.payload.openingCash, "openingCash");

  const existingOpenShift = await fetchOpenShiftByBranchActor(
    supabase,
    options.actorProfileId,
    branchId
  );

  if (existingOpenShift) {
    throw new SalesDeskDomainError("SHIFT_ALREADY_OPEN", {
      shiftId: existingOpenShift.id,
      branchId,
    });
  }

  const insertPayload = {
    branch_id: branchId,
    opened_by: options.actorProfileId,
    opening_cash: openingCash,
    status: SHIFT_STATUS_OPEN,
    note: sanitizeText(options.payload.note),
    created_by: options.actorProfileId,
    updated_by: options.actorProfileId,
  };

  const { data, error } = await supabase
    .from("sales_shifts")
    .insert(insertPayload)
    .select(SALES_SHIFT_SELECT)
    .single<SalesShiftRow>();

  if (error) {
    if (error.code === "23505") {
      throw new SalesDeskDomainError("SHIFT_ALREADY_OPEN", {
        branchId,
      });
    }
    throw error;
  }

  const reconciliation = buildEmptyReconciliation(openingCash);
  const shift = mapSalesShiftRow(data, reconciliation);
  await writeShiftAuditEvent(supabase, {
    branchId,
    actorProfileId: options.actorProfileId,
    shift,
    reconciliation,
    action: "SHIFT_OPENED",
    reason: options.payload.note,
  });

  return shift;
}

export async function closeSalesShiftForActor(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    payload: CloseSalesShiftPayload;
  }
): Promise<SalesShiftDto> {
  const actor = await assertSalesActor(supabase, options.actorProfileId);
  const branchId = await resolveActorBranchId(
    supabase,
    actor,
    options.payload.branchId
  );
  const closingCash = assertCashAmount(options.payload.closingCash, "closingCash");
  const closeNote = sanitizeText(options.payload.note);

  const shiftIdFilter = sanitizeText(options.payload.shiftId);

  let openShiftQuery = supabase
    .from("sales_shifts")
    .select(SALES_SHIFT_SELECT)
    .eq("opened_by", options.actorProfileId)
    .eq("branch_id", branchId)
    .eq("status", SHIFT_STATUS_OPEN)
    .order("opened_at", { ascending: false })
    .limit(1);

  if (shiftIdFilter) {
    openShiftQuery = openShiftQuery.eq("id", shiftIdFilter);
  }

  const { data: openShiftRow, error: openShiftError } =
    await openShiftQuery.maybeSingle<SalesShiftRow>();

  if (openShiftError) throw openShiftError;
  if (!openShiftRow) {
    throw new SalesDeskDomainError("SHIFT_NOT_FOUND", {
      actorProfileId: options.actorProfileId,
      branchId,
      shiftId: shiftIdFilter,
    });
  }

  if (openShiftRow.status === SHIFT_STATUS_CLOSED) {
    throw new SalesDeskDomainError("SHIFT_ALREADY_CLOSED", {
      shiftId: openShiftRow.id,
    });
  }

  const closeAt = new Date().toISOString();
  const openingCash = roundMoney(parseNumeric(openShiftRow.opening_cash));
  const reconciliation = await computeShiftReconciliation(supabase, {
    branchId,
    openedBy: options.actorProfileId,
    openingCash,
    openedAt: openShiftRow.opened_at,
    closedAt: closeAt,
    closingCash,
  });

  if (reconciliation.variance !== null && Math.abs(reconciliation.variance) > 0 && !closeNote) {
    throw new SalesDeskDomainError("SHIFT_VARIANCE_NOTE_REQUIRED", {
      shiftId: openShiftRow.id,
      expectedClosingCash: reconciliation.expectedClosingCash,
      variance: reconciliation.variance,
    });
  }

  const closePayload = {
    status: SHIFT_STATUS_CLOSED,
    closed_by: options.actorProfileId,
    closed_at: closeAt,
    closing_cash: closingCash,
    note: closeNote,
    updated_by: options.actorProfileId,
  };

  const { data: closedShiftRow, error: closeError } = await supabase
    .from("sales_shifts")
    .update(closePayload)
    .eq("id", openShiftRow.id)
    .select(SALES_SHIFT_SELECT)
    .single<SalesShiftRow>();

  if (closeError) throw closeError;

  const shift = mapSalesShiftRow(closedShiftRow, reconciliation);
  await writeShiftAuditEvent(supabase, {
    branchId,
    actorProfileId: options.actorProfileId,
    shift,
    reconciliation,
    action: "SHIFT_CLOSED",
    reason: options.payload.note,
  });

  return shift;
}

export async function listSalesShiftsForActor(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    query: SalesShiftListQuery;
  }
): Promise<SalesShiftListResponse> {
  const actor = await assertSalesActor(supabase, options.actorProfileId);
  assertShiftManagementRole(actor);

  const branchId = await resolveActorBranchId(supabase, actor, options.query.branchId);
  const pageRaw = Math.max(1, Math.trunc(options.query.page ?? 1));
  const pageSizeRaw = Math.max(
    1,
    Math.min(Math.trunc(options.query.pageSize ?? DEFAULT_SHIFT_LIST_PAGE_SIZE), MAX_SHIFT_LIST_PAGE_SIZE)
  );
  const fromOffset = (pageRaw - 1) * pageSizeRaw;
  const toOffset = fromOffset + pageSizeRaw - 1;
  const statusFilter = sanitizeText(options.query.status)?.toUpperCase();
  const fromDate = toIsoStartOfDay(options.query.fromDate);
  const toDate = toIsoEndOfDay(options.query.toDate);
  const staffId = sanitizeText(options.query.staffId);

  let listQuery = supabase
    .from("sales_shifts")
    .select(SALES_SHIFT_SELECT)
    .eq("branch_id", branchId)
    .order("opened_at", { ascending: false })
    .range(fromOffset, toOffset);

  let countQuery = supabase
    .from("sales_shifts")
    .select("id", { count: "exact", head: true })
    .eq("branch_id", branchId);

  if (statusFilter === SHIFT_STATUS_OPEN || statusFilter === SHIFT_STATUS_CLOSED) {
    listQuery = listQuery.eq("status", statusFilter);
    countQuery = countQuery.eq("status", statusFilter);
  }

  if (staffId) {
    listQuery = listQuery.eq("opened_by", staffId);
    countQuery = countQuery.eq("opened_by", staffId);
  }

  if (fromDate) {
    listQuery = listQuery.gte("opened_at", fromDate);
    countQuery = countQuery.gte("opened_at", fromDate);
  }

  if (toDate) {
    listQuery = listQuery.lte("opened_at", toDate);
    countQuery = countQuery.lte("opened_at", toDate);
  }

  const [{ data: rows, error: rowsError }, { count, error: countError }] = await Promise.all([
    listQuery.returns<SalesShiftRow[]>(),
    countQuery,
  ]);

  if (rowsError) throw rowsError;
  if (countError) throw countError;

  const profileIds = Array.from(
    new Set(
      (rows ?? [])
        .flatMap((shift) => [shift.opened_by, shift.closed_by ?? ""])
        .filter(Boolean)
    )
  );
  const profileNameMap = await buildProfileNameMap(supabase, profileIds);

  const items: SalesShiftDetailDto[] = [];
  for (const shift of rows ?? []) {
    const detail = await buildShiftDetail(supabase, {
      shift,
      profileNameMap,
    });
    items.push(detail);
  }

  return {
    items,
    total: Math.max(0, count ?? 0),
    page: pageRaw,
    pageSize: pageSizeRaw,
  };
}

export async function getSalesShiftDetailForActor(
  supabase: SupabaseClient,
  options: {
    actorProfileId: string;
    shiftId: string;
    branchId?: string | null;
  }
): Promise<SalesShiftDetailDto | null> {
  const actor = await assertSalesActor(supabase, options.actorProfileId);
  assertShiftManagementRole(actor);

  const branchId = await resolveActorBranchId(supabase, actor, options.branchId);
  const shiftId = sanitizeText(options.shiftId);
  if (!shiftId) return null;

  const { data: shiftRow, error } = await supabase
    .from("sales_shifts")
    .select(SALES_SHIFT_SELECT)
    .eq("id", shiftId)
    .eq("branch_id", branchId)
    .maybeSingle<SalesShiftRow>();

  if (error) throw error;
  if (!shiftRow) return null;

  const profileNameMap = await buildProfileNameMap(supabase, [
    shiftRow.opened_by,
    shiftRow.closed_by ?? "",
  ]);

  return buildShiftDetail(supabase, {
    shift: shiftRow,
    profileNameMap,
  });
}
