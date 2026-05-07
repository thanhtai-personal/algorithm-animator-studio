export type NotificationSeverity = "info" | "success" | "warning" | "error";

export interface NotificationPayloadDto {
  [key: string]: unknown;
}

export interface NotificationItemDto {
  id: string;
  recipientProfileId: string;
  branchId: string | null;
  type: string;
  severity: NotificationSeverity;
  title: string;
  body: string;
  payload: NotificationPayloadDto;
  eventKey: string | null;
  isRead: boolean;
  readAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsListQuery {
  cursor?: string | null;
  limit?: number;
  isRead?: boolean | null;
}

export interface NotificationsListResponse {
  items: NotificationItemDto[];
  unreadCount: number;
  nextCursor: string | null;
}

export interface MarkNotificationReadResponse {
  item: NotificationItemDto;
  unreadCount: number;
}

export interface MarkAllNotificationsReadResponse {
  updatedCount: number;
  unreadCount: number;
}
