import type { OrderPaymentMethod } from '../../orders/types/orders-domain.type';
import type { ProductGender } from '../../products/types/products-catalog.type';

export type ProcurementIntakeChannel = 'MANUAL' | 'EXCEL';
export type ProcurementImportResolvedAction = 'UPDATE_EXISTING' | 'CREATE_NEW';

export type ProcurementImportTemplateColumn =
  | 'product_code'
  | 'name'
  | 'quantity'
  | 'rent_price_per_day'
  | 'quick_rent_price'
  | 'purchase_price'
  | 'sale_price'
  | 'category_code'
  | 'is_rentable'
  | 'is_saleable'
  | 'material'
  | 'gender'
  | 'description'
  | 'cover_image_url'
  | 'item_size'
  | 'note';

export type ProcurementImportErrorCode =
  | 'REQUIRED'
  | 'INVALID_NUMBER'
  | 'INVALID_INTEGER'
  | 'INVALID_BOOLEAN'
  | 'INVALID_ENUM'
  | 'NOT_FOUND'
  | 'INVALID_VALUE'
  | 'INTERNAL_ERROR';

export interface ProcurementExpensePaymentInput {
  amount: number;
  method: OrderPaymentMethod;
  note?: string | null;
  reason?: string | null;
}

export interface ProcurementLineInput {
  productId?: string | null;
  productCode?: string | null;
  name?: string | null;
  categoryCode?: string | null;
  rentPricePerDay?: number | null;
  quickRentPrice?: number | null;
  purchasePrice?: number | null;
  salePrice?: number | null;
  isRentable?: boolean | null;
  isSaleable?: boolean | null;
  material?: string | null;
  gender?: ProductGender | null;
  description?: string | null;
  coverImageUrl?: string | null;
  quantity: number;
  unitCostAmount: number;
  itemSize?: string | null;
  note?: string | null;
}

export interface CreateProcurementReceiptPayload {
  branchId?: string | null;
  intakeChannel?: ProcurementIntakeChannel;
  intakeSourceFileName?: string | null;
  supplierName?: string | null;
  supplierPhone?: string | null;
  note?: string | null;
  lines: ProcurementLineInput[];
  expensePayment?: ProcurementExpensePaymentInput | null;
}

export interface UpdateProcurementReceiptPayload {
  supplierName?: string | null;
  supplierPhone?: string | null;
  note?: string | null;
  lines: ProcurementLineInput[];
  expensePayment?: ProcurementExpensePaymentInput | null;
}

export interface RollbackProcurementReceiptPayload {
  reason?: string | null;
}

export interface ProcurementReceiptSummaryDto {
  id: string;
  branchId: string;
  receiptCode: string;
  intakeChannel: ProcurementIntakeChannel;
  intakeSourceFileName: string | null;
  supplierName: string | null;
  supplierPhone: string | null;
  note: string | null;
  totalQuantity: number;
  totalCostAmount: number;
  paymentExpenseAmount: number;
  paymentMethod: OrderPaymentMethod | null;
  paymentNote: string | null;
  paidAt: string | null;
  isRolledBack: boolean;
  rolledBackAt: string | null;
  rollbackReason: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProcurementReceiptLineDto {
  id: string;
  receiptId: string;
  productId: string | null;
  productCodeSnapshot: string | null;
  productNameSnapshot: string | null;
  quantity: number;
  unitCostAmount: number;
  lineTotalAmount: number;
  rentPricePerDay: number | null;
  quickRentPrice: number | null;
  purchasePrice: number | null;
  salePrice: number | null;
  categoryCodeSnapshot: string | null;
  isRentable: boolean | null;
  isSaleable: boolean | null;
  material: string | null;
  gender: ProductGender | null;
  description: string | null;
  coverImageUrl: string | null;
  itemSize: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProcurementReceiptDetailDto {
  summary: ProcurementReceiptSummaryDto;
  lines: ProcurementReceiptLineDto[];
}

export interface ProcurementListQuery {
  branchId?: string | null;
  search?: string | null;
  intakeChannel?: ProcurementIntakeChannel | null;
  startDate?: string | null;
  endDate?: string | null;
  page?: number;
  pageSize?: number;
}

export interface ProcurementListResponse {
  items: ProcurementReceiptSummaryDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProcurementReceiptRollbackResultDto {
  receiptId: string;
  receiptCode: string;
  rolledBackAt: string;
  retiredItemCount: number;
  voidedPaymentCount: number;
}

export interface ProcurementReceiptCreateProductsResultDto {
  receipt: ProcurementReceiptDetailDto;
  createdProductCount: number;
  linkedExistingProductCount: number;
  createdItemCount: number;
  skippedLineCount: number;
}

export interface ProcurementProductOptionDto {
  id: string;
  productCode: string;
  name: string;
  rentPricePerDay: number | null;
  salePrice: number | null;
  purchasePrice: number | null;
  stockTotal: number;
}

export interface ProcurementCategoryOptionDto {
  id: string;
  branchId: string | null;
  code: string;
  name: string;
}

export interface ProcurementProductsQuery {
  branchId?: string | null;
  search?: string | null;
  page?: number;
  pageSize?: number;
}

export interface ProcurementProductsResponse {
  items: ProcurementProductOptionDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProcurementCategoriesQuery {
  branchId?: string | null;
  search?: string | null;
  page?: number;
  pageSize?: number;
}

export interface ProcurementCategoriesResponse {
  items: ProcurementCategoryOptionDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProcurementImportContextInput {
  defaultCategoryCode?: string | null;
  defaultIsRentable?: boolean | null;
  defaultIsSaleable?: boolean | null;
}

export interface ProcurementImportValidationErrorDto {
  sheetName: string;
  rowNumber: number;
  column: ProcurementImportTemplateColumn | 'sheet' | 'unknown';
  code: ProcurementImportErrorCode;
  message: string;
}

export interface ProcurementImportNormalizedRowDto {
  sheetName: string;
  rowNumber: number;
  resolvedAction: ProcurementImportResolvedAction;
  productId: string | null;
  productCode: string | null;
  willGenerateProductCode: boolean;
  productName: string | null;
  quantity: number;
  unitCostAmount: number;
  rentPricePerDay: number | null;
  quickRentPrice: number | null;
  purchasePrice: number | null;
  salePrice: number | null;
  categoryCode: string | null;
  isRentable: boolean | null;
  isSaleable: boolean | null;
  material: string | null;
  gender: ProductGender | null;
  description: string | null;
  coverImageUrl: string | null;
  itemSize: string | null;
  note: string | null;
  lineTotalAmount: number;
}

export interface ProcurementImportValidationSummaryDto {
  totalRows: number;
  validRows: number;
  invalidRows: number;
}

export interface ProcurementImportValidatePayload {
  branchId?: string | null;
  file: File;
  context?: ProcurementImportContextInput | null;
}

export interface ProcurementImportValidationResponse {
  branchId: string;
  sheetName: string;
  isValid: boolean;
  summary: ProcurementImportValidationSummaryDto;
  normalizedRows: ProcurementImportNormalizedRowDto[];
  errors: ProcurementImportValidationErrorDto[];
  templateColumns: readonly ProcurementImportTemplateColumn[];
}

export interface ProcurementImportCommitPayload {
  branchId?: string | null;
  file: File;
  context?: ProcurementImportContextInput | null;
  intakeSourceFileName?: string | null;
  supplierName?: string | null;
  supplierPhone?: string | null;
  note?: string | null;
  expensePayment?: ProcurementExpensePaymentInput | null;
}

export interface ProcurementImportSuccessRowDto {
  sheetName: string;
  rowNumber: number;
  resolvedAction: ProcurementImportResolvedAction;
  productId: string | null;
  productCode: string | null;
  productName: string | null;
  quantity: number;
  unitCostAmount: number;
  lineTotalAmount: number;
  generatedProductCode: boolean;
}

export interface ProcurementImportIncompleteRowDto {
  sheetName: string;
  rowNumber: number;
  resolvedAction: ProcurementImportResolvedAction | null;
  productCode: string | null;
  generatedProductCode: string | null;
  productName: string | null;
  quantity: number | null;
  unitCostAmount: number | null;
  rentPricePerDay: number | null;
  quickRentPrice: number | null;
  purchasePrice: number | null;
  salePrice: number | null;
  itemSize: string | null;
  note: string | null;
  reason: string;
  errors: ProcurementImportValidationErrorDto[];
}

export interface ProcurementImportCommitSummaryDto {
  totalRows: number;
  successRows: number;
  incompleteRows: number;
}

export interface ProcurementImportCommitResponse {
  branchId: string;
  receipt: ProcurementReceiptDetailDto | null;
  summary: ProcurementImportCommitSummaryDto;
  successRows: ProcurementImportSuccessRowDto[];
  incompleteRows: ProcurementImportIncompleteRowDto[];
}

export interface ProcurementImportIncompleteExportPayload {
  rows: ProcurementImportIncompleteRowDto[];
}
