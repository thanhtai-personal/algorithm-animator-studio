import type {
  OrderPaymentMethod,
  OrderPaymentStatus,
  OrderPaymentType,
} from '../../orders/types/orders-domain.type';

export interface PaymentsListQuery {
  branchId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  type?: OrderPaymentType | null;
  method?: OrderPaymentMethod | null;
  page?: number;
  pageSize?: number;
}

export interface PaymentListItemDto {
  id: string;
  branchId: string;
  orderId: string | null;
  orderCode: string | null;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  type: OrderPaymentType;
  method: OrderPaymentMethod;
  status: OrderPaymentStatus;
  amount: number;
  signedAmount: number;
  reason: string | null;
  source: string | null;
  isImportOrder: boolean;
  isInitialCapital: boolean;
  note: string | null;
  referenceCode: string | null;
  voidReason: string | null;
  voidedAt: string | null;
  createdBy: string | null;
  createdByName: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  attachmentCount: number;
}

export interface PaymentsTotalsDto {
  postedCount: number;
  byMethod: Record<OrderPaymentMethod, number>;
  byType: Record<OrderPaymentType, number>;
  grossInflow: number;
  grossRefund: number;
  netTotal: number;
}

export interface PaymentDailyCashbookRowDto {
  date: string;
  byMethod: Record<OrderPaymentMethod, number>;
  grossInflow: number;
  grossRefund: number;
  netTotal: number;
}

export interface PaymentsListResponse {
  items: PaymentListItemDto[];
  total: number;
  page: number;
  pageSize: number;
  totals: PaymentsTotalsDto;
  dailyCashbook: PaymentDailyCashbookRowDto[];
}

export interface UpdatePaymentStatusPayload {
  status: OrderPaymentStatus;
  voidReason?: string | null;
}

export type PosManualPaymentType = Extract<OrderPaymentType, 'FEE' | 'EXPENSE'>;

export interface UpdateManualPaymentPayload {
  type?: PosManualPaymentType;
  method?: OrderPaymentMethod;
  amount?: number;
  reason?: string;
  note?: string | null;
  referenceCode?: string | null;
  isInitialCapital?: boolean;
  receiptUploadSessionIds?: string[];
}

export interface CreatePosManualPaymentPayload {
  branchId?: string | null;
  type: PosManualPaymentType;
  method: OrderPaymentMethod;
  amount: number;
  reason: string;
  note?: string | null;
  referenceCode?: string | null;
  isImportOrder?: boolean | null;
  isInitialCapital?: boolean | null;
  receiptUploadSessionIds?: string[];
}

export interface PaymentAttachmentDto {
  id: string;
  paymentId: string;
  branchId: string;
  mimeType: string;
  sizeBytes: number;
  originalFileName: string | null;
  signedUrl: string;
  expiresInSeconds: number;
  createdAt: string;
}

export interface PreparePaymentReceiptUploadPayload {
  branchId?: string | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface PreparePaymentReceiptUploadResponse {
  uploadSessionId: string;
  branchId: string;
  bucket: string;
  storagePath: string;
  expiresAt: string;
}

export interface PaymentAttachmentListResponse {
  paymentId: string;
  attachments: PaymentAttachmentDto[];
}
