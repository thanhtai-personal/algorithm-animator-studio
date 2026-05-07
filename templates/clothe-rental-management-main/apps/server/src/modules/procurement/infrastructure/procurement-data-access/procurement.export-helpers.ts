import ExcelJS from 'exceljs';
import type { ProcurementImportIncompleteExportPayload } from '../../types/procurement-module.type';
import {
  DEFAULT_IMPORT_SHEET_NAME,
  IMPORT_ERROR_EXPORT_COLUMN,
  TEMPLATE_COLUMNS,
  TEMPLATE_HEADER_LABELS,
  type ProcurementTemplateLocale,
} from './procurement.constants';

export async function buildTemplateWorkbookBuffer(
  locale: ProcurementTemplateLocale,
): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(
    locale === 'vi' ? 'NhapHangMau' : DEFAULT_IMPORT_SHEET_NAME,
  );
  const header = TEMPLATE_COLUMNS.map(
    (column) => TEMPLATE_HEADER_LABELS[locale][column],
  );
  sheet.addRow(header);

  if (locale === 'vi') {
    sheet.addRow([
      'SP001',
      'Áo dài lụa',
      2,
      120000,
      120000,
      350000,
      890000,
      '',
      'true',
      'true',
      'Lụa',
      'female',
      'Lô nhập mới',
      'https://images.example.com/sp001.jpg',
      'M',
      'Nhập lô đầu tiên',
    ]);
    sheet.addRow([
      '',
      'Vest nam đen',
      1,
      150000,
      150000,
      420000,
      990000,
      '',
      'true',
      'true',
      'Polyester',
      'male',
      '',
      '',
      'L',
      'Không có mã, hệ thống tự tạo',
    ]);
  } else {
    sheet.addRow([
      'SP001',
      'Silk ao dai',
      2,
      120000,
      120000,
      350000,
      890000,
      '',
      'true',
      'true',
      'Silk',
      'female',
      'New intake lot',
      'https://images.example.com/sp001.jpg',
      'M',
      'First procurement lot',
    ]);
    sheet.addRow([
      '',
      'Black men suit',
      1,
      150000,
      150000,
      420000,
      990000,
      '',
      'true',
      'true',
      'Polyester',
      'male',
      '',
      '',
      'L',
      'No product code, system will generate one',
    ]);
  }

  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  for (let index = 0; index < header.length; index += 1) {
    sheet.getColumn(index + 1).width = 18;
  }
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };

  const bytes = await workbook.xlsx.writeBuffer();
  return new Uint8Array(bytes);
}

export async function buildIncompleteWorkbookBuffer(
  payload: ProcurementImportIncompleteExportPayload,
): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('IncompleteRows');
  sheet.addRow([...TEMPLATE_COLUMNS, IMPORT_ERROR_EXPORT_COLUMN]);

  for (const row of payload.rows) {
    sheet.addRow([
      row.generatedProductCode ?? row.productCode ?? '',
      row.productName ?? '',
      row.quantity ?? '',
      row.rentPricePerDay ?? '',
      row.quickRentPrice ?? '',
      row.purchasePrice ?? '',
      row.salePrice ?? '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      row.itemSize ?? '',
      row.note ?? '',
      row.reason,
    ]);
  }

  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  for (let index = 0; index <= TEMPLATE_COLUMNS.length; index += 1) {
    sheet.getColumn(index + 1).width = 20;
  }
  sheet.getRow(1).font = { bold: true };

  const bytes = await workbook.xlsx.writeBuffer();
  return new Uint8Array(bytes);
}
