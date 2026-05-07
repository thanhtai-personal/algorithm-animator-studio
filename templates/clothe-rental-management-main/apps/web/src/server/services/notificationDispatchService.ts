import type { OrderStatus } from "@/types/domainPrimitives";
import type { CalendarRemindersDto } from "@/types/calendarModule";
import type { PaymentListItemDto } from "@/types/paymentsDomain";
import type { OrderPaymentDto } from "@/types/ordersDomain";
import {
  createNotificationsForRecipients,
  fanoutNotificationToBranch,
} from "@/server/data-access/notifications";

const ORDER_STATUS_NOTIFICATION_SET = new Set<OrderStatus>([
  "RESERVED",
  "CONFIRMED",
  "PICKED_UP",
  "RETURNED",
  "DEBT",
  "CANCELLED",
]);

function describeOrderStatus(status: OrderStatus): string {
  if (status === "RESERVED") return "Hẹn ngày thuê";
  if (status === "CONFIRMED") return "Đã xác nhận";
  if (status === "PICKED_UP") return "Đã nhận đồ";
  if (status === "RETURNED") return "Đã trả đồ";
  if (status === "DEBT") return "Đơn nợ";
  if (status === "CANCELLED") return "Đã hủy";
  return status;
}

export async function notifyOrderStatusChanged(options: {
  branchId: string;
  orderId: string;
  orderCode: string;
  status: OrderStatus;
  updatedAt: string;
  actorProfileId: string;
  reason?: string | null;
}): Promise<void> {
  if (!ORDER_STATUS_NOTIFICATION_SET.has(options.status)) {
    return;
  }

  await fanoutNotificationToBranch({
    branchId: options.branchId,
    recipientRoles: ["owner_admin", "manager", "staff"],
    type: "ORDER_STATUS_CHANGED",
    severity:
      options.status === "CANCELLED" || options.status === "DEBT" ? "warning" : "info",
    title: `Đơn ${options.orderCode} ${describeOrderStatus(options.status)}`,
    body: options.reason
      ? `Lý do: ${options.reason}`
      : `Trạng thái mới: ${describeOrderStatus(options.status)}.`,
    payload: {
      orderId: options.orderId,
      orderCode: options.orderCode,
      status: options.status,
      reason: options.reason ?? null,
    },
    eventKey: `order-status:${options.orderId}:${options.status}:${options.updatedAt}`,
    createdBy: options.actorProfileId,
  });
}

function containsManualReviewHint(item: PaymentListItemDto): boolean {
  const joined = [item.reason, item.source, item.note, item.referenceCode]
    .filter((entry): entry is string => typeof entry === "string" && entry.length > 0)
    .join(" ")
    .toLowerCase();

  return joined.includes("manual") || joined.includes("review") || joined.includes("soat");
}

export async function notifyPaymentException(options: {
  item: PaymentListItemDto;
  actorProfileId: string;
}): Promise<void> {
  const shouldNotify = options.item.status === "VOIDED" || containsManualReviewHint(options.item);
  if (!shouldNotify) {
    return;
  }

  const orderCode = options.item.orderCode ?? "(no-order-code)";

  await fanoutNotificationToBranch({
    branchId: options.item.branchId,
    recipientRoles: ["owner_admin", "manager", "accountant"],
    type: "PAYMENT_EXCEPTION",
    severity: "warning",
    title: `Thanh toán cần kiểm tra (${orderCode})`,
    body:
      options.item.status === "VOIDED"
        ? `Phiếu thanh toán ${options.item.id} đã VOIDED.`
        : `Phiếu thanh toán ${options.item.id} có dấu hiệu manual-review.`,
    payload: {
      paymentId: options.item.id,
      orderId: options.item.orderId,
      orderCode: options.item.orderCode,
      status: options.item.status,
      reason: options.item.reason,
      source: options.item.source,
      note: options.item.note,
    },
    eventKey: `payment-exception:${options.item.id}:${options.item.status}:${options.item.updatedAt}`,
    createdBy: options.actorProfileId,
  });
}

export async function notifyOrderPaymentException(options: {
  branchId: string;
  orderCode: string | null;
  payment: OrderPaymentDto;
  actorProfileId: string;
}): Promise<void> {
  const pseudoPayment: PaymentListItemDto = {
    id: options.payment.id,
    branchId: options.branchId,
    orderId: options.payment.orderId,
    orderCode: options.orderCode,
    customerId: options.payment.customerId,
    customerName: null,
    customerPhone: null,
    type: options.payment.type,
    method: options.payment.method,
    status: options.payment.status,
    amount: options.payment.amount,
    signedAmount: options.payment.type === "REFUND" ? -Math.abs(options.payment.amount) : Math.abs(options.payment.amount),
    reason: options.payment.reason,
    source: options.payment.source,
    isImportOrder: false,
    isInitialCapital: false,
    note: options.payment.note,
    referenceCode: options.payment.referenceCode,
    voidReason: options.payment.voidReason,
    voidedAt: options.payment.voidedAt,
    createdBy: options.payment.createdBy,
    createdByName: null,
    updatedBy: options.payment.updatedBy,
    createdAt: options.payment.createdAt,
    updatedAt: options.payment.updatedAt,
    attachmentCount: 0,
  };

  await notifyPaymentException({
    item: pseudoPayment,
    actorProfileId: options.actorProfileId,
  });
}

export async function notifyCalendarRemindersForActor(options: {
  recipientProfileId: string;
  branchId: string;
  today: string;
  reminders: CalendarRemindersDto;
}): Promise<void> {
  const notifications = [] as Array<{
    recipientProfileId: string;
    branchId: string;
    type: string;
    severity: "warning";
    title: string;
    body: string;
    payload: Record<string, unknown>;
    eventKey: string;
  }>;

  for (const overdue of options.reminders.overdueOrders.slice(0, 3)) {
    notifications.push({
      recipientProfileId: options.recipientProfileId,
      branchId: options.branchId,
      type: "REMINDER_OVERDUE_ORDER",
      severity: "warning",
      title: `Đơn quá hạn: ${overdue.orderCode}`,
      body: `Đơn đã quá hạn ${overdue.overdueDays} ngày.`,
      payload: {
        orderId: overdue.orderId,
        orderCode: overdue.orderCode,
        overdueDays: overdue.overdueDays,
        status: overdue.status,
      },
      eventKey: `reminder-overdue:${options.today}:${overdue.orderId}`,
    });
  }

  for (const stuck of options.reminders.stuckItems.slice(0, 3)) {
    notifications.push({
      recipientProfileId: options.recipientProfileId,
      branchId: options.branchId,
      type: "REMINDER_STUCK_ITEM",
      severity: "warning",
      title: `Item kẹt ${stuck.status}: ${stuck.itemCode}`,
      body: `Item ở trạng thái ${stuck.status} đã ${stuck.staleDays} ngày.`,
      payload: {
        itemId: stuck.itemId,
        itemCode: stuck.itemCode,
        status: stuck.status,
        staleDays: stuck.staleDays,
      },
      eventKey: `reminder-stuck:${options.today}:${stuck.itemId}:${stuck.status}`,
    });
  }

  if (notifications.length === 0) {
    return;
  }

  await createNotificationsForRecipients({ notifications });
}

export async function runNotificationSideEffect(task: () => Promise<void>): Promise<void> {
  try {
    await task();
  } catch (error) {
    console.warn("notification side-effect failed", error);
  }
}
