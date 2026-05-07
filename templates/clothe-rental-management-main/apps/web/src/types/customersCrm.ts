import type { OrderStatus } from "@/types/domainPrimitives";

export interface CustomerTagDto {
  id: string;
  branchId: string;
  code: string;
  name: string;
  color: string | null;
  isSystem: boolean;
  warnOnOrderCreate: boolean;
  blockOrderCreate: boolean;
  isActive: boolean;
}

export interface CustomerListItemDto {
  id: string;
  branchId: string;
  customerCode: string | null;
  fullName: string;
  phone: string | null;
  phoneNormalized: string | null;
  socialLink: string | null;
  address: string | null;
  note: string | null;
  isActive: boolean;
  tags: CustomerTagDto[];
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
  updatedAt: string;
}

export interface CustomersListQuery {
  branchId?: string | null;
  search?: string;
  tagId?: string | null;
  page?: number;
  pageSize?: number;
}

export interface CustomersListResponse {
  items: CustomerListItemDto[];
  total: number;
  page: number;
  pageSize: number;
  tags: CustomerTagDto[];
}

export interface CustomerOrderHistoryRowDto {
  orderId: string;
  orderCode: string;
  status: OrderStatus;
  startDate: string;
  endDate: string;
  totalAmount: number;
  depositAmount: number;
  createdAt: string;
}

export interface CustomerIncidentsSummaryDto {
  totalCount: number;
  openCount: number;
  lateCount: number;
  damageCount: number;
  lostCount: number;
  cleaningCount: number;
  totalAmount: number;
}

export interface CustomerDetailDto {
  customer: CustomerListItemDto;
  availableTags: CustomerTagDto[];
  ordersHistory: CustomerOrderHistoryRowDto[];
  incidentsSummary: CustomerIncidentsSummaryDto;
}

export interface CreateCustomerPayload {
  branchId: string;
  fullName: string;
  phone: string;
  socialLink?: string | null;
  address?: string | null;
  note?: string | null;
  isActive?: boolean;
  tagIds?: string[];
}

export interface UpdateCustomerPayload {
  fullName?: string;
  phone?: string;
  socialLink?: string | null;
  address?: string | null;
  note?: string | null;
  isActive?: boolean;
  tagIds?: string[];
}

export interface CustomersTypeaheadQuery {
  branchId?: string | null;
  search: string;
  limit?: number;
}

export interface CustomerTypeaheadItemDto {
  id: string;
  branchId: string;
  fullName: string;
  phone: string | null;
  phoneNormalized: string | null;
  isActive: boolean;
  tags: CustomerTagDto[];
  warnOnOrderCreate: boolean;
  blockOrderCreate: boolean;
  isVip: boolean;
  isBlacklist: boolean;
}

export interface CustomersTypeaheadResponse {
  items: CustomerTypeaheadItemDto[];
}
