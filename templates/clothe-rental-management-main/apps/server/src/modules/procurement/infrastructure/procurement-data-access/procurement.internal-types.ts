import type { ProductGender } from '../../../products/types/products-catalog.type';
import type {
  CreateProcurementReceiptPayload,
  ProcurementImportContextInput,
  ProcurementImportNormalizedRowDto,
  ProcurementImportResolvedAction,
  ProcurementImportTemplateColumn,
  ProcurementImportValidationErrorDto,
} from '../../types/procurement-module.type';

export interface ProfileActorRow {
  id: string;
  role: string | null;
  default_branch_id: string | null;
}

export interface ProfileBranchAccessRow {
  branch_id: string;
}

export interface ProfileNameRow {
  id: string;
  full_name: string | null;
}

export interface ProcurementReceiptRow {
  id: string;
  branch_id: string;
  receipt_code: string;
  intake_channel: string;
  intake_source_file_name: string | null;
  supplier_name: string | null;
  supplier_phone: string | null;
  note: string | null;
  total_quantity: number | string | null;
  total_cost_amount: number | string | null;
  payment_expense_amount: number | string | null;
  payment_method: string | null;
  payment_note: string | null;
  paid_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProcurementReceiptItemRow {
  id: string;
  receipt_id: string;
  product_id: string | null;
  product_code_snapshot: string | null;
  product_name_snapshot: string | null;
  quantity: number | string | null;
  unit_cost_amount: number | string | null;
  line_total_amount: number | string | null;
  rent_price_per_day: number | string | null;
  quick_rent_price: number | string | null;
  purchase_price: number | string | null;
  sale_price: number | string | null;
  category_code_snapshot: string | null;
  is_rentable: boolean | null;
  is_saleable: boolean | null;
  material: string | null;
  gender: ProductGender | null;
  description: string | null;
  cover_image_url: string | null;
  item_size: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface ItemRollbackCandidateRow {
  id: string;
  product_id: string;
  item_code: string;
  status: string;
  branch_id: string;
}

export interface ProcurementPaymentRow {
  id: string;
  method: string | null;
  reason: string | null;
  status: string;
  note: string | null;
  amount?: number | string | null;
  is_import_order?: boolean | null;
}

export interface ItemReferenceRow {
  item_id: string;
}

export interface ItemStatusLogHistoryRow {
  item_id: string;
  to_status: string;
}

export interface ProcurementReceiptRollbackNoteMeta {
  at: string;
  by: string;
  reason: string | null;
}

export interface ProcurementProductRow {
  id: string;
  branch_id: string | null;
  product_code: string;
  name: string;
  category_id: string | null;
  cover_image_path?: string | null;
  gender: string | null;
  material: string | null;
  description: string | null;
  rent_price_per_day: number | string | null;
  sale_price: number | string | null;
  purchase_price: number | string | null;
  is_rentable: boolean;
  is_saleable: boolean;
  is_active: boolean;
  is_archived: boolean;
}

export interface ProductCategoryRow {
  id: string;
  branch_id: string | null;
  code: string;
  name: string;
  sort_order?: number | string | null;
  is_active: boolean;
}

export interface ItemCountRow {
  product_id: string;
  status: string;
}

export interface InsertedProcurementReceiptRow {
  id: string;
  receipt_code: string;
  branch_id: string;
  created_at: string;
}

export interface InsertedItemRow {
  id: string;
  item_code: string;
  status: string;
}

export interface ProcurementActorContext {
  actor: ProfileActorRow;
  role: string;
  branchId: string;
}

export interface ProcurementImportServerPayload {
  branchId?: string | null;
  fileName: string | null;
  fileBuffer: Uint8Array;
  context?: ProcurementImportContextInput | null;
}

export interface ProcurementImportCommitServerPayload extends ProcurementImportServerPayload {
  intakeSourceFileName?: string | null;
  supplierName?: string | null;
  supplierPhone?: string | null;
  note?: string | null;
  expensePayment?: CreateProcurementReceiptPayload['expensePayment'];
}

export interface ParsedImportRow {
  sheetName: string;
  rowNumber: number;
  productCode: string | null;
  name: string | null;
  quantity: number | null;
  unitCostAmount: number | null;
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
}

export interface ImportValidationRow {
  parsed: ParsedImportRow;
  resolvedAction: ProcurementImportResolvedAction | null;
  matchedProduct: ProcurementProductRow | null;
  errors: ProcurementImportValidationErrorDto[];
}

export interface ImportValidationResult {
  branchId: string;
  sheetName: string;
  rows: ImportValidationRow[];
  normalizedRows: ProcurementImportNormalizedRowDto[];
  errors: ProcurementImportValidationErrorDto[];
}

export interface ProcurementRollbackNoteParseResult {
  cleanNote: string | null;
  rollbackMeta: ProcurementReceiptRollbackNoteMeta | null;
}

export interface NormalizedProcurementLineInput {
  sheetName: string;
  rowNumber: number;
  productId: string | null;
  productCode: string | null;
  name: string | null;
  categoryCode: string | null;
  rentPricePerDay: number | null;
  quickRentPrice: number | null;
  purchasePrice: number | null;
  salePrice: number | null;
  isRentable: boolean | null;
  isSaleable: boolean | null;
  material: string | null;
  gender: ProductGender | null;
  description: string | null;
  coverImageUrl: string | null;
  quantity: number;
  unitCostAmount: number;
  itemSize: string | null;
  note: string | null;
}

export interface ResolvedProcurementLine {
  sheetName: string;
  rowNumber: number;
  resolvedAction: ProcurementImportResolvedAction;
  generatedProductCode: string | null;
  productId: string;
  productCodeSnapshot: string;
  productNameSnapshot: string;
  quantity: number;
  unitCostAmount: number;
  lineTotalAmount: number;
  rentPricePerDay: number;
  quickRentPrice: number | null;
  purchasePrice: number;
  salePrice: number;
  itemSize: string | null;
  note: string | null;
}

export type ImportErrorColumn =
  | ProcurementImportTemplateColumn
  | 'sheet'
  | 'unknown';
