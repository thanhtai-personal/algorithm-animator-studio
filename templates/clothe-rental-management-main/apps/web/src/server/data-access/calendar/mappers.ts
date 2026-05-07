// filepath: apps/web/src/server/data-access/calendar/mappers.ts
import type { CalendarEventDto, CalendarReminderItemDto, CalendarReminderOrderDto } from "@/types/calendarModule";
import type { OrderRow, CustomerRow, ItemRow, ResolvedOrder } from "./types";
import { normalizeOrderStatus, diffDaysBetweenIsoDates, diffDaysFromNow, orderToEventTitle, isActiveOrderStatus } from "./utils";

export function mapOrderToResolvedOrder(row: OrderRow, customer: CustomerRow | undefined): ResolvedOrder {
  return {
    orderId: row.id,
    orderCode: row.order_code,
    customerId: row.customer_id,
    customerName: customer?.full_name?.trim() || "Unknown customer",
    customerPhone: customer?.phone ?? null,
    status: normalizeOrderStatus(row.status),
    startDate: row.start_date,
    endDate: row.end_date,
    updatedAt: row.updated_at,
  };
}

export function mapEvents(options: {
  orders: OrderRow[];
  customerById: Map<string, CustomerRow>;
  startDate: string;
  endDate: string;
  today: string;
}): CalendarEventDto[] {
  const events: CalendarEventDto[] = [];

  const inRange = (date: string) => date >= options.startDate && date <= options.endDate;

  for (const row of options.orders) {
    const status = normalizeOrderStatus(row.status);
    const customer = options.customerById.get(row.customer_id);

    const order = mapOrderToResolvedOrder(row, customer);

    if (inRange(row.start_date) && isActiveOrderStatus(status)) {
      events.push({
        id: `pickup:${row.id}:${row.start_date}`,
        order,
        type: "pickup",
        date: row.start_date,
        isOverdue: false,
        title: orderToEventTitle("pickup", row.order_code),
      });
    }

    if (inRange(row.end_date) && isActiveOrderStatus(status)) {
      events.push({
        id: `return:${row.id}:${row.end_date}`,
        order,
        type: "return",
        date: row.end_date,
        isOverdue: false,
        title: orderToEventTitle("return", row.order_code),
      });
    }

    if (status === "RESERVED" && inRange(row.start_date)) {
      events.push({
        id: `booking:${row.id}:${row.start_date}`,
        order,
        type: "booking",
        date: row.start_date,
        isOverdue: false,
        title: orderToEventTitle("booking", row.order_code),
      });
    }

    if (status === "PICKED_UP" && row.end_date < options.today && inRange(row.end_date)) {
      events.push({
        id: `overdue:${row.id}:${row.end_date}`,
        order,
        type: "overdue",
        date: row.end_date,
        isOverdue: true,
        title: orderToEventTitle("overdue", row.order_code),
      });
    }
  }

  return events.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }

    return a.order.orderCode.localeCompare(b.order.orderCode);
  });
}

export function mapOverdueReminderRows(options: {
  orders: OrderRow[];
  customerById: Map<string, CustomerRow>;
  today: string;
}): CalendarReminderOrderDto[] {
  return options.orders.map((row) => {
    const customer = options.customerById.get(row.customer_id);

    return {
      orderId: row.id,
      orderCode: row.order_code,
      customerName: customer?.full_name?.trim() || "Unknown customer",
      customerPhone: customer?.phone ?? null,
      status: normalizeOrderStatus(row.status),
      endDate: row.end_date,
      overdueDays: diffDaysBetweenIsoDates(row.end_date, options.today),
    };
  });
}

export function mapStuckItems(rows: ItemRow[]): CalendarReminderItemDto[] {
  return rows.map((row) => {
    const normalizedStatus = row.status.trim().toUpperCase();

    return {
      itemId: row.id,
      itemCode: row.item_code,
      status: normalizedStatus === "MAINTENANCE" ? "MAINTENANCE" : "LAUNDRY",
      updatedAt: row.updated_at,
      staleDays: diffDaysFromNow(row.updated_at),
    };
  });
}