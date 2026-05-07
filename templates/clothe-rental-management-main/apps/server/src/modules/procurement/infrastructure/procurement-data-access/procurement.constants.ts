import type { OrderPaymentMethod } from '../../../orders/types/orders-domain.type';
import type {
  ProcurementImportTemplateColumn,
  ProcurementIntakeChannel,
} from '../../types/procurement-module.type';

export const PROCUREMENT_ROLE_SET = new Set<string>([
  'owner_admin',
  'admin',
  'manager',
  'staff',
]);

export const PROCUREMENT_ROLLBACK_ROLE_SET = new Set<string>([
  'owner_admin',
  'admin',
  'manager',
]);

export const PAYMENT_METHOD_SET = new Set<OrderPaymentMethod>([
  'CASH',
  'BANK',
  'MOMO',
]);

export const INTAKE_CHANNEL_SET = new Set<ProcurementIntakeChannel>([
  'MANUAL',
  'EXCEL',
]);

export const STOCK_COUNTED_ITEM_STATUS_SET = new Set<string>([
  'READY',
  'RESERVED',
  'ON_RENT',
  'LAUNDRY',
  'MAINTENANCE',
  'DAMAGED',
  'LOST',
]);

export const PROCUREMENT_ROLLBACK_BLOCKED_ITEM_STATUS_SET = new Set<string>([
  'RESERVED',
  'ON_RENT',
  'SOLD',
]);

export const TEMPLATE_COLUMNS: readonly ProcurementImportTemplateColumn[] = [
  'product_code',
  'name',
  'quantity',
  'rent_price_per_day',
  'quick_rent_price',
  'purchase_price',
  'sale_price',
  'category_code',
  'is_rentable',
  'is_saleable',
  'material',
  'gender',
  'description',
  'cover_image_url',
  'item_size',
  'note',
];

export const TEMPLATE_REQUIRED_COLUMNS: ReadonlySet<ProcurementImportTemplateColumn> =
  new Set(['quantity', 'rent_price_per_day', 'purchase_price', 'sale_price']);

export type ProcurementTemplateLocale = 'vi' | 'en';

export const TEMPLATE_HEADER_LABELS: Record<
  ProcurementTemplateLocale,
  Record<ProcurementImportTemplateColumn, string>
> = {
  vi: {
    product_code: 'Mã sản phẩm',
    name: 'Tên sản phẩm',
    quantity: 'Số lượng',
    rent_price_per_day: 'Giá thuê',
    quick_rent_price: 'Giá thuê nhanh',
    purchase_price: 'Giá nhập',
    sale_price: 'Giá bán',
    category_code: 'Mã danh mục',
    is_rentable: 'Cho thuê',
    is_saleable: 'Cho bán',
    material: 'Chất liệu',
    gender: 'Giới tính',
    description: 'Mô tả',
    cover_image_url: 'URL ảnh bìa',
    item_size: 'Kích cỡ item',
    note: 'Ghi chú',
  },
  en: {
    product_code: 'Product code',
    name: 'Product name',
    quantity: 'Quantity',
    rent_price_per_day: 'Rent price',
    quick_rent_price: 'Quick rent price',
    purchase_price: 'Purchase price',
    sale_price: 'Sale price',
    category_code: 'Category code',
    is_rentable: 'Is rentable',
    is_saleable: 'Is saleable',
    material: 'Material',
    gender: 'Gender',
    description: 'Description',
    cover_image_url: 'Cover image URL',
    item_size: 'Item size',
    note: 'Note',
  },
};

const TEMPLATE_HEADER_ALIASES: Record<
  ProcurementImportTemplateColumn,
  readonly string[]
> = {
  product_code: ['product_code', 'product code', 'ma san pham', 'mã sản phẩm'],
  name: ['name', 'product name', 'ten san pham', 'tên sản phẩm'],
  quantity: ['quantity', 'so luong', 'số lượng'],
  rent_price_per_day: [
    'rent_price_per_day',
    'rent price per day',
    'rent/day',
    'rent price',
    'gia thue',
    'giá thuê',
    'gia thue ngay',
    'giá thuê ngày',
    'gia thue/ngay',
    'giá thuê/ngày',
  ],
  quick_rent_price: [
    'quick_rent_price',
    'quick rent price',
    'gia thue nhanh',
    'giá thuê nhanh',
  ],
  purchase_price: ['purchase_price', 'purchase price', 'gia nhap', 'giá nhập'],
  sale_price: ['sale_price', 'sale price', 'gia ban', 'giá bán'],
  category_code: [
    'category_code',
    'category code',
    'ma danh muc',
    'mã danh mục',
  ],
  is_rentable: ['is_rentable', 'is rentable', 'cho thue', 'cho thuê'],
  is_saleable: ['is_saleable', 'is saleable', 'cho ban', 'cho bán'],
  material: ['material', 'chat lieu', 'chất liệu'],
  gender: ['gender', 'gioi tinh', 'giới tính'],
  description: ['description', 'mo ta', 'mô tả'],
  cover_image_url: [
    'cover_image_url',
    'cover image url',
    'cover_image',
    'cover image',
    'url anh bia',
    'url ảnh bìa',
  ],
  item_size: ['item_size', 'item size', 'kich co item', 'kích cỡ item'],
  note: ['note', 'ghi chu', 'ghi chú'],
};

export const TEMPLATE_HEADER_ALIAS_TO_COLUMN = new Map<
  string,
  ProcurementImportTemplateColumn
>();

for (const column of TEMPLATE_COLUMNS) {
  TEMPLATE_HEADER_ALIAS_TO_COLUMN.set(column, column);
  for (const alias of TEMPLATE_HEADER_ALIASES[column]) {
    const normalizedAlias = alias
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    if (normalizedAlias) {
      TEMPLATE_HEADER_ALIAS_TO_COLUMN.set(normalizedAlias, column);
    }
  }
}

export const IMPORT_ERROR_EXPORT_COLUMN = 'error_reason';
export const DEFAULT_IMPORT_SHEET_NAME = 'ProcurementImport';

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MAX_IMPORT_ROW_COUNT = 5_000;
export const PROCUREMENT_ROLLBACK_NOTE_META_PREFIX =
  '##PROCUREMENT_ROLLBACK_META##';

export const PROCUREMENT_RECEIPT_SELECT =
  'id, branch_id, receipt_code, intake_channel, intake_source_file_name, supplier_name, supplier_phone, note, total_quantity, total_cost_amount, payment_expense_amount, payment_method, payment_note, paid_at, created_by, created_at, updated_at';

export const PROCUREMENT_RECEIPT_ITEMS_SELECT =
  'id, receipt_id, product_id, product_code_snapshot, product_name_snapshot, quantity, unit_cost_amount, line_total_amount, rent_price_per_day, quick_rent_price, purchase_price, sale_price, category_code_snapshot, is_rentable, is_saleable, material, gender, description, cover_image_url, item_size, note, created_at, updated_at';
