export type SalesShiftStatus = "OPEN" | "CLOSED";
export type SalesShiftOrderType = "RENTAL" | "SALE";
export type SalesShiftOrderStatus =
  | "DRAFT"
  | "RESERVED"
  | "CONFIRMED"
  | "PICKED_UP"
  | "RETURNED"
  | "DEBT"
  | "COMPLETED"
  | "CANCELLED";

export interface SalesShiftReconciliationDto {
  cashPaymentCount: number;
  cashInflow: number;
  cashRefund: number;
  cashNetMovement: number;
  expectedClosingCash: number;
  variance: number | null;
}

export interface SalesShiftDto {
  id: string;
  branchId: string;
  openedBy: string;
  openedByName: string | null;
  openedAt: string;
  openingCash: number;
  status: SalesShiftStatus;
  closedBy: string | null;
  closedByName: string | null;
  closedAt: string | null;
  closingCash: number | null;
  note: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  reconciliation: SalesShiftReconciliationDto | null;
}

export interface SalesShiftSessionSummaryDto {
  orderCount: number;
  totalReceivedAmount: number;
  totalDepositAmount: number;
  totalRentalAmount: number;
  totalSaleAmount: number;
}

export interface SalesShiftOrderSnapshotDto {
  orderId: string;
  orderCode: string;
  orderType: SalesShiftOrderType;
  status: SalesShiftOrderStatus;
  customerId: string;
  customerName: string | null;
  customerPhone: string | null;
  totalAmount: number;
  depositAmount: number;
  createdAt: string;
}

export interface SalesShiftDetailDto extends SalesShiftDto {
  summary: SalesShiftSessionSummaryDto;
  orders: SalesShiftOrderSnapshotDto[];
}

export interface SalesShiftCurrentDetailResponse {
  shift: SalesShiftDetailDto | null;
}

export interface SalesShiftCurrentResponse {
  shift: SalesShiftDto | null;
}

export interface OpenSalesShiftPayload {
  branchId?: string | null;
  openingCash: number;
  note?: string | null;
}

export interface CloseSalesShiftPayload {
  branchId?: string | null;
  shiftId?: string | null;
  closingCash: number;
  note?: string | null;
}

export interface SalesShiftActionResponse {
  shift: SalesShiftDto;
}

export interface SalesShiftListQuery {
  branchId?: string | null;
  staffId?: string | null;
  status?: SalesShiftStatus | null;
  fromDate?: string | null;
  toDate?: string | null;
  page?: number;
  pageSize?: number;
}

export interface SalesShiftListResponse {
  items: SalesShiftDetailDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SalesShiftDetailResponse {
  shift: SalesShiftDetailDto | null;
}
