import type { OrderStatus } from "@/types/domainPrimitives";

export type CalendarViewMode = "month" | "week" | "day";

export type CalendarEventType = "pickup" | "return" | "booking" | "overdue";

export interface CalendarOrderRefDto {
  orderId: string;
  orderCode: string;
  customerId: string;
  customerName: string;
  customerPhone: string | null;
  status: OrderStatus;
  startDate: string;
  endDate: string;
  updatedAt: string;
}

export interface CalendarEventDto {
  id: string;
  order: CalendarOrderRefDto;
  type: CalendarEventType;
  date: string;
  isOverdue: boolean;
  title: string;
}

export interface CalendarReminderOrderDto {
  orderId: string;
  orderCode: string;
  customerName: string;
  customerPhone: string | null;
  status: OrderStatus;
  endDate: string;
  overdueDays: number;
}

export interface CalendarReminderItemDto {
  itemId: string;
  itemCode: string;
  status: "LAUNDRY" | "MAINTENANCE";
  updatedAt: string;
  staleDays: number;
}

export interface CalendarRemindersDto {
  overdueOrders: CalendarReminderOrderDto[];
  stuckItems: CalendarReminderItemDto[];
  laundryStuckThresholdDays: number;
}

export interface CalendarEventsResponse {
  branchId: string;
  timezone: string;
  currencyCode: string;
  startDate: string;
  endDate: string;
  today: string;
  events: CalendarEventDto[];
  reminders: CalendarRemindersDto;
}

export interface CalendarEventsQuery {
  branchId?: string | null;
  startDate: string;
  endDate: string;
}
