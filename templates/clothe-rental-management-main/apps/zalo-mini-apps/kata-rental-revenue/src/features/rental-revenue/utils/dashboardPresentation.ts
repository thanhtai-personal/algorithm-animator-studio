import type {
  DashboardActivityRowDto,
  DashboardModuleMetricKey,
  RevenueDailyRowDto,
  RevenueReportGranularity,
} from "@/lib/contracts";

export type DashboardTone = "neutral" | "warning" | "danger" | "success";

export function formatDashboardMoney(
  value: number | null | undefined,
  currencyCode = "VND"
): string {
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(value ?? 0);
  } catch {
    return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value ?? 0);
  }
}

export function formatDashboardDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(date);
}

export function formatDashboardDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function resolveDashboardStatusLabel(status: string): string {
  const normalized = status.trim().toUpperCase();
  if (normalized === "PICKED_UP") return "Đang thuê";
  if (normalized === "RETURNED") return "Đã trả";
  if (normalized === "RESERVED") return "Giữ chỗ";
  if (normalized === "CONFIRMED") return "Đã xác nhận";
  if (normalized === "CANCELLED") return "Đã hủy";
  if (normalized === "DRAFT") return "Nháp";
  if (normalized === "DEBT") return "Còn nợ";
  if (normalized === "COMPLETED") return "Hoàn tất";
  if (normalized === "OVERDUE") return "Quá hạn";
  return status;
}

export function resolveDashboardStatusTone(status: string): DashboardTone {
  const normalized = status.trim().toUpperCase();
  if (normalized === "OVERDUE" || normalized === "CANCELLED" || normalized === "DEBT") return "danger";
  if (normalized === "COMPLETED") return "success";
  if (normalized === "PICKED_UP" || normalized === "RESERVED") return "warning";
  if (normalized === "RETURNED" || normalized === "CONFIRMED") return "success";
  return "neutral";
}

export function resolveDashboardModuleLabel(module: DashboardModuleMetricKey): string {
  if (module === "ALL_MODULES") return "Toàn bộ";
  if (module === "RENTAL_SALE_MODULE") return "Thuê đồ + Bán hàng";
  return "Trang điểm";
}

const ACTIVITY_ACTION_LABELS: Record<string, string> = {
  cancel: "Hủy đơn",
  create: "Tạo mới",
  update: "Cập nhật",
  ITEM_STATUS_CHANGED: "Cập nhật trạng thái item",
  ORDER_CANCELLED: "Hủy đơn",
  ORDER_CREATED: "Tạo đơn",
  ORDER_ITEMS_CHANGED: "Cập nhật sản phẩm trong đơn",
  ORDER_PRICE_ADJUSTED: "Điều chỉnh giá đơn",
  ORDER_REFUND_RECORDED: "Ghi nhận hoàn tiền",
  ORDER_STATUS_CHANGED: "Đổi trạng thái đơn",
  ORDER_UPDATED: "Cập nhật đơn",
  PAYMENT_DETAILS_UPDATED: "Cập nhật thông tin giao dịch",
  PAYMENT_STATUS_UPDATED: "Cập nhật trạng thái giao dịch",
  PROCUREMENT_RECEIPT_CREATED: "Tạo đơn nhập hàng",
  PROCUREMENT_RECEIPT_DELETED: "Xóa đơn nhập hàng",
  PROCUREMENT_RECEIPT_PRODUCTS_CREATED: "Tạo sản phẩm từ đơn nhập hàng",
  PROCUREMENT_RECEIPT_ROLLED_BACK: "Xóa đơn nhập hàng",
  PROCUREMENT_RECEIPT_UPDATED: "Cập nhật đơn nhập hàng",
  PRODUCT_ARCHIVED: "Lưu trữ sản phẩm",
  PRODUCT_CREATED: "Tạo sản phẩm",
  PRODUCT_ITEMS_ADDED: "Thêm item sản phẩm",
  PRODUCT_ITEM_DELETED: "Xóa item sản phẩm",
  PRODUCT_ITEM_UPDATED: "Cập nhật item sản phẩm",
  PRODUCT_OVERVIEW_UPDATED: "Cập nhật thông tin sản phẩm",
  PRODUCT_PRICING_UPDATED: "Cập nhật giá sản phẩm",
  SHIFT_CLOSED: "Kết ca POS",
  SHIFT_OPENED: "Mở ca POS",
  "settings.general.update": "Cập nhật thiết lập chung",
  "settings.showroom-pages.update": "Cập nhật trang showroom",
};

const ACTIVITY_ENTITY_LABELS: Record<string, string> = {
  payment: "Giao dịch",
  product: "Sản phẩm",
  PROCUREMENT_RECEIPT: "Đơn nhập hàng",
  rental_order: "Đơn hàng",
  sales_shift: "Ca POS",
  settings: "Thiết lập",
};

export function resolveDashboardActivityLabel(activity: DashboardActivityRowDto): string {
  const action = activity.action.trim();
  const actionLabel = ACTIVITY_ACTION_LABELS[action] ?? ACTIVITY_ACTION_LABELS[action.toUpperCase()];
  if (actionLabel) return actionLabel;

  const entity = activity.entityType.trim();
  const entityLabel = ACTIVITY_ENTITY_LABELS[entity] ?? ACTIVITY_ENTITY_LABELS[entity.toUpperCase()] ?? entity;
  const fallbackAction = action
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  return [entityLabel, fallbackAction].filter(Boolean).join(" - ");
}

export function buildDashboardActivityTrendRows(activities: DashboardActivityRowDto[]) {
  const counts = new Map<string, number>();
  for (const activity of activities) {
    const dateKey = activity.createdAt.slice(0, 10);
    counts.set(dateKey, (counts.get(dateKey) ?? 0) + 1);
  }

  const rows = Array.from(counts.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-7)
    .map(([date, count]) => ({
      date,
      label: formatDashboardDate(date),
      count,
    }));

  const maxCount = rows.reduce((current, row) => Math.max(current, row.count), 1);

  return rows.map((row) => ({
    ...row,
    width: `${Math.max(12, Math.round((row.count / maxCount) * 100))}%`,
  }));
}

export function buildDashboardRevenueTrendRows(
  rows: RevenueDailyRowDto[],
  startDate?: string | null,
  endDate?: string | null,
  granularity: RevenueReportGranularity = "day"
) {
  const rowByDate = new Map<string, RevenueDailyRowDto>();
  for (const row of rows) {
    const periodKey = normalizePeriodKey(row.date, granularity);
    rowByDate.set(periodKey, row);
  }

  const sortedPeriods = Array.from(rowByDate.keys()).sort((left, right) => left.localeCompare(right));
  const fromDate = normalizePeriodKey(startDate ?? sortedPeriods[0] ?? "", granularity) || null;
  const toDate = normalizePeriodKey(endDate ?? sortedPeriods[sortedPeriods.length - 1] ?? "", granularity) || null;
  if (!fromDate || !toDate) return [];
  const allPeriods = enumeratePeriodRange(fromDate, toDate, granularity);

  const visibleRows = allPeriods.map((periodKey) => {
    const existing = rowByDate.get(periodKey);
    if (existing) return existing;
    return {
      date: periodKey,
      revenueGross: 0,
      refundEffective: 0,
      revenueNet: 0,
      cogs: 0,
      grossProfit: 0,
      profitMargin: 0,
      realProfit: 0,
      cashInflow: 0,
      cashOutflow: 0,
      depositCollectedTotal: 0,
      depositRefundedTotal: 0,
      totalRevenue: 0,
      depositCollected: 0,
      depositRefunded: 0,
      refunds: 0,
      net: 0,
    } satisfies RevenueDailyRowDto;
  });

  const maxRevenue = visibleRows.reduce(
    (current, row) => Math.max(current, Math.abs(row.revenueNet)),
    1
  );

  return visibleRows.map((row) => ({
    ...row,
    date: normalizePeriodKey(row.date, granularity),
    label: formatDashboardPeriodLabel(row.date, granularity),
    width: `${Math.max(10, Math.round((Math.abs(row.revenueNet) / maxRevenue) * 100))}%`,
  }));
}

export function formatDashboardPeriodLabel(
  value: string,
  granularity: RevenueReportGranularity
): string {
  if (granularity === "year") {
    const yearMatch = value.match(/^(\d{4})/);
    return yearMatch ? yearMatch[1] : value;
  }

  if (granularity === "month") {
    const monthMatch = value.match(/^(\d{4})-(\d{2})/);
    if (monthMatch) {
      const [, year, month] = monthMatch;
      return `${month}/${year}`;
    }
  }

  return formatDashboardDate(value);
}

function enumeratePeriodRange(
  startDate: string,
  endDate: string,
  granularity: RevenueReportGranularity
): string[] {
  const start = parsePeriodStart(startDate, granularity);
  const end = parsePeriodStart(endDate, granularity);
  if (!start || !end) return [startDate, endDate].filter((value, index, source) => source.indexOf(value) === index);
  if (start.getTime() > end.getTime()) return [startDate];

  const periods: string[] = [];
  const cursor = new Date(start.getTime());

  while (cursor.getTime() <= end.getTime()) {
    periods.push(formatPeriodKeyFromDate(cursor, granularity));
    if (granularity === "day") {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
      continue;
    }
    if (granularity === "month") {
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
      continue;
    }
    cursor.setUTCFullYear(cursor.getUTCFullYear() + 1);
  }

  return periods;
}

function normalizePeriodKey(value: string, granularity: RevenueReportGranularity): string {
  if (!value) return "";
  const trimmed = value.trim();

  if (granularity === "year") {
    const yearMatch = trimmed.match(/^(\d{4})/);
    return yearMatch ? yearMatch[1] : trimmed;
  }

  if (granularity === "month") {
    const monthMatch = trimmed.match(/^(\d{4})-(\d{2})/);
    return monthMatch ? `${monthMatch[1]}-${monthMatch[2]}` : trimmed;
  }

  const parsed = parseIsoDate(trimmed);
  if (!parsed) return trimmed;
  return formatIsoDate(parsed);
}

function parsePeriodStart(
  value: string,
  granularity: RevenueReportGranularity
): Date | null {
  if (granularity === "year") {
    const yearMatch = value.match(/^(\d{4})/);
    if (!yearMatch) return null;
    const year = Number(yearMatch[1]);
    const date = new Date(Date.UTC(year, 0, 1));
    if (Number.isNaN(date.getTime())) return null;
    return date;
  }

  if (granularity === "month") {
    const monthMatch = value.match(/^(\d{4})-(\d{2})/);
    if (!monthMatch) return null;
    const year = Number(monthMatch[1]);
    const month = Number(monthMatch[2]);
    const date = new Date(Date.UTC(year, month - 1, 1));
    if (Number.isNaN(date.getTime())) return null;
    return date;
  }

  return parseIsoDate(value);
}

function formatPeriodKeyFromDate(
  date: Date,
  granularity: RevenueReportGranularity
): string {
  if (granularity === "year") {
    return String(date.getUTCFullYear());
  }
  if (granularity === "month") {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }
  return formatIsoDate(date);
}

function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [yearRaw, monthRaw, dayRaw] = value.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatIsoDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
