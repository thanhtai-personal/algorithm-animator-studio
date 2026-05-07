"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AppLocale } from "@/constants/locale";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import {
  fetchProcurementReceiptDetailById,
  useCreateProductsFromProcurementReceiptMutation,
  useProcurementCategoriesQuery,
  useCommitProcurementImportMutation,
  useCreateProcurementReceiptMutation,
  useExportProcurementIncompleteRowsMutation,
  useExportProcurementTemplateMutation,
  useProcurementProductsQuery,
  useProcurementReceiptDetailQuery,
  useProcurementReceiptsQuery,
  useRollbackProcurementReceiptMutation,
  useUpdateProcurementReceiptMutation,
  useValidateProcurementImportMutation,
} from "@/features/procurement/queries/useProcurementQueries";
import { procurementStore } from "@/features/procurement/stores/procurementStore";
import type { OrderPaymentMethod } from "@/types/ordersDomain";
import type { ProcurementCategoryOptionDto } from "@/types/procurement";

interface ProcurementPageCopy {
  title: string;
  subtitle: string;
  sectionManual: string;
  sectionImport: string;
  sectionHistory: string;
  createAction: string;
  creatingAction: string;
  editAction: string;
  createProductsAction: string;
  creatingProductsAction: string;
  saveEditAction: string;
  savingEditAction: string;
  cancelEditAction: string;
  rollbackAction: string;
  rollingBackAction: string;
  addLineAction: string;
  removeLineAction: string;
  validateImportAction: string;
  validatingAction: string;
  commitImportAction: string;
  committingAction: string;
  downloadTemplateAction: string;
  exportIncompleteAction: string;
  resetManualAction: string;
  searchPlaceholder: string;
  productSearchPlaceholder: string;
  emptyHistory: string;
  emptyValidation: string;
  branchMissing: string;
  importHint: string;
  fields: {
    importBranch: string;
    defaultCategoryCode: string;
    defaultCategoryPlaceholder: string;
    defaultIsRentable: string;
    defaultIsSaleable: string;
    supplierName: string;
    supplierPhone: string;
    note: string;
    productCode: string;
    productName: string;
    categoryCode: string;
    quantity: string;
    unitCost: string;
    rentPricePerDay: string;
    salePrice: string;
    purchasePrice: string;
    lineTotal: string;
    itemSize: string;
    paymentExpenseEnabled: string;
    paymentMethod: string;
    paymentAmount: string;
    paymentNote: string;
    fileUpload: string;
  };
  intakeChannel: {
    manual: string;
    excel: string;
  };
  paymentMethods: Record<OrderPaymentMethod, string>;
  booleanSelect: {
    auto: string;
    yes: string;
    no: string;
  };
  rowAction: {
    update: string;
    create: string;
    generateCode: string;
  };
  errors: {
    invalidLine: string;
    fileRequired: string;
    incompleteRowsMissing: string;
    templateExportFailed: string;
    importCommitFailed: string;
    rollbackFailed: string;
    updateFailed: string;
    createProductsFailed: string;
    invalidUpdateLine: string;
    immutableReceipt: string;
    rollbackRequired: string;
    rollbackForbidden: string;
    rollbackAlreadyDone: string;
    rollbackBlockedByItemState: string;
    rollbackBlockedByItemUsage: string;
    rollbackItemMismatch: string;
  };
  summary: {
    totalRows: string;
    validRows: string;
    invalidRows: string;
    commitSummary: string;
    successRows: string;
    incompleteRows: string;
    productsCount: string;
  };
  table: {
    sheet: string;
    row: string;
    column: string;
    code: string;
    message: string;
    action: string;
    reason: string;
    name: string;
    channel: string;
    quantityShort: string;
    costShort: string;
    expenseShort: string;
    created: string;
    stock: string;
    purchase: string;
  };
  pagination: {
    prev: string;
    next: string;
  };
}

const PAGE_SIZE = 20;

type TernaryFlag = "AUTO" | "TRUE" | "FALSE";

interface ManualLineDraft {
  id: string;
  productCodeInput: string;
  nameInput: string;
  categoryCodeInput: string;
  quantityInput: string;
  unitCostInput: string;
  rentPricePerDayInput: string;
  salePriceInput: string;
  purchasePriceInput: string;
  itemSize: string;
  note: string;
}

interface EditReceiptLineDraft {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  quantityInput: string;
  unitCostInput: string;
  rentPricePerDayInput: string;
  quickRentPriceInput: string;
  purchasePriceInput: string;
  salePriceInput: string;
  categoryCodeInput: string;
  itemSizeInput: string;
  noteInput: string;
}

function createLineDraft(): ManualLineDraft {
  return {
    id: `line-${Math.random().toString(36).slice(2, 10)}`,
    productCodeInput: "",
    nameInput: "",
    categoryCodeInput: "",
    quantityInput: "1",
    unitCostInput: "",
    rentPricePerDayInput: "",
    salePriceInput: "",
    purchasePriceInput: "",
    itemSize: "",
    note: "",
  };
}

function parseQuantity(value: string): number | null {
  const parsed = Number.parseInt(value.trim(), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function parseMoney(value: string): number | null {
  const normalized = value.trim().replace(/,/g, "");
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function ternaryToBoolean(value: TernaryFlag): boolean | null {
  if (value === "TRUE") return true;
  if (value === "FALSE") return false;
  return null;
}

function normalizeSearchToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function resolveOtherCategoryCode(options: ProcurementCategoryOptionDto[]): string | null {
  for (const option of options) {
    const normalizedCode = normalizeSearchToken(option.code);
    const normalizedName = normalizeSearchToken(option.name);
    if (
      normalizedCode === "other" ||
      normalizedCode === "khac" ||
      normalizedName === "other" ||
      normalizedName === "khac" ||
      normalizedName.includes("other") ||
      normalizedName.includes("khac")
    ) {
      return option.code;
    }
  }

  return null;
}

function resolveCategoryCodeFromInput(
  value: string,
  options: ProcurementCategoryOptionDto[]
): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const normalizedInput = normalizeSearchToken(trimmed);
  const codeMatched = options.find(
    (entry) => normalizeSearchToken(entry.code) === normalizedInput
  );
  if (codeMatched) return codeMatched.code;

  const nameMatched = options.find(
    (entry) => normalizeSearchToken(entry.name) === normalizedInput
  );
  if (nameMatched) return nameMatched.code;

  const dashToken = trimmed.split("-")[0]?.trim();
  if (dashToken) {
    const dashMatched = options.find(
      (entry) => normalizeSearchToken(entry.code) === normalizeSearchToken(dashToken)
    );
    if (dashMatched) return dashMatched.code;
  }

  return trimmed.toUpperCase();
}

const PROCUREMENT_COPY: Record<AppLocale, ProcurementPageCopy> = {
  vi: {
    title: "Nhập hàng",
    subtitle:
      "Nhập tay hoặc import file Excel (.xlsx), hỗ trợ upsert sản phẩm theo product_code và thống kê dòng chưa hoàn thành.",
    sectionManual: "Nhập hàng thủ công",
    sectionImport: "Nhập file Excel chuẩn (.xlsx)",
    sectionHistory: "Lịch sử phiếu nhập",
    createAction: "Tạo phiếu nhập",
    creatingAction: "Đang tạo...",
    editAction: "Sửa",
    createProductsAction: "Tạo sản phẩm",
    creatingProductsAction: "Đang tạo sản phẩm...",
    saveEditAction: "Lưu chỉnh sửa",
    savingEditAction: "Đang lưu...",
    cancelEditAction: "Hủy sửa",
    rollbackAction: "Hoàn tác",
    rollingBackAction: "Đang hoàn tác...",
    addLineAction: "Thêm dòng",
    removeLineAction: "Xóa dòng",
    validateImportAction: "Kiểm tra file",
    validatingAction: "Đang kiểm tra...",
    commitImportAction: "Xác nhận import",
    committingAction: "Đang xác nhận...",
    downloadTemplateAction: "Tải template .xlsx",
    exportIncompleteAction: "Export dòng lỗi .xlsx",
    resetManualAction: "Xóa form",
    searchPlaceholder: "Tìm theo mã phiếu / NCC...",
    productSearchPlaceholder: "Tìm sản phẩm theo mã/tên...",
    emptyHistory: "Chưa có phiếu nhập nào.",
    emptyValidation: "Chưa có kết quả validate import.",
    branchMissing: "Chưa xác định được chi nhánh hoạt động.",
    importHint:
      "Template .xlsx hỗ trợ cột upsert: product_code, name, quantity, purchase_price, category_code...; thiếu product_code sẽ auto-generate khi commit.",
    fields: {
      importBranch: "Phòng trưng bày nhập",
      defaultCategoryCode: "Danh mục mặc định",
      defaultCategoryPlaceholder: "Tìm/chọn danh mục (mặc định: Khác)",
      defaultIsRentable: "Cho thuê",
      defaultIsSaleable: "Cho bán",
      supplierName: "Nhà cung cấp",
      supplierPhone: "SĐT nhà cung cấp",
      note: "Ghi chú",
      productCode: "Mã sản phẩm",
      productName: "Tên sản phẩm",
      categoryCode: "Mã danh mục",
      quantity: "Số lượng",
      unitCost: "Giá nhập",
      rentPricePerDay: "Giá thuê",
      salePrice: "Giá bán",
      purchasePrice: "Giá nhập",
      lineTotal: "Thành tiền",
      itemSize: "Kích cỡ item",
      paymentExpenseEnabled: "Khoản chi hoàn tất cùng phiếu nhập",
      paymentMethod: "Phương thức chi",
      paymentAmount: "Số tiền chi",
      paymentNote: "Ghi chú khoản chi",
      fileUpload: "File import (.xlsx)",
    },
    intakeChannel: {
      manual: "Nhập tay",
      excel: "Nhập file",
    },
    paymentMethods: {
      CASH: "Tiền mặt",
      BANK: "Chuyển khoản",
      MOMO: "MoMo",
    },
    booleanSelect: {
      auto: "Giữ mặc định",
      yes: "Có",
      no: "Không",
    },
    rowAction: {
      update: "Cập nhật sản phẩm cũ",
      create: "Tạo sản phẩm mới",
      generateCode: "Tự sinh mã khi commit",
    },
    errors: {
      invalidLine:
        "Mỗi dòng cần quantity > 0, giá thuê >= 0, giá bán >= 0, giá nhập >= 0 và có product_code hoặc name để tạo mới.",
      fileRequired: "Vui lòng chọn file .xlsx để validate/import.",
      incompleteRowsMissing: "Không có dòng lỗi để export.",
      templateExportFailed: "Tải template thất bại.",
      importCommitFailed: "Xác nhận import thất bại.",
      rollbackFailed: "Hoàn tác phiếu nhập thất bại.",
      updateFailed: "Cập nhật phiếu nhập thất bại.",
      createProductsFailed: "Tạo sản phẩm từ phiếu nhập thất bại.",
      invalidUpdateLine:
        "Dòng chỉnh sửa cần quantity > 0, unit cost >= 0 và xác định được sản phẩm.",
      immutableReceipt:
        "Phiếu nhập đã tạo là bất biến. Không thể sửa trực tiếp số lượng/giá; hãy hoàn tác và tạo lại.",
      rollbackRequired:
        "Không thể chỉnh trực tiếp số lượng nhập. Hãy hoàn tác phiếu nhập liên quan rồi tạo lại.",
      rollbackForbidden: "Bạn không có quyền hoàn tác phiếu nhập.",
      rollbackAlreadyDone: "Phiếu nhập này đã được hoàn tác trước đó.",
      rollbackBlockedByItemState:
        "Không thể hoàn tác vì có món đồ đang ở trạng thái không hợp lệ (đang thuê/đã đặt/đã bán).",
      rollbackBlockedByItemUsage:
        "Không thể hoàn tác vì có món đồ đã từng bán hoặc đã từng cho thuê, hoặc đã phát sinh giữ chỗ/bảo trì/sự cố.",
      rollbackItemMismatch:
        "Không thể hoàn tác vì số món đồ thực tế không khớp với số lượng phiếu nhập.",
    },
    summary: {
      totalRows: "Tổng dòng",
      validRows: "Hợp lệ",
      invalidRows: "Lỗi",
      commitSummary: "Kết quả import",
      successRows: "thành công",
      incompleteRows: "chưa hoàn thành",
      productsCount: "Sản phẩm",
    },
    table: {
      sheet: "Sheet",
      row: "Dòng",
      column: "Cột",
      code: "Mã",
      message: "Thông báo",
      action: "Hành động",
      reason: "Lý do",
      name: "Tên",
      channel: "Kênh",
      quantityShort: "SL",
      costShort: "Chi phí",
      expenseShort: "Khoản chi",
      created: "Ngày tạo",
      stock: "Tồn kho",
      purchase: "Giá nhập",
    },
    pagination: {
      prev: "Trước",
      next: "Sau",
    },
  },
  en: {
    title: "Procurement Intake",
    subtitle:
      "Manual intake or native Excel (.xlsx) import with product upsert by product_code and incomplete-row export.",
    sectionManual: "Manual intake",
    sectionImport: "Native Excel import (.xlsx)",
    sectionHistory: "Procurement history",
    createAction: "Create receipt",
    creatingAction: "Creating...",
    editAction: "Edit",
    createProductsAction: "Create products",
    creatingProductsAction: "Creating products...",
    saveEditAction: "Save edit",
    savingEditAction: "Saving...",
    cancelEditAction: "Cancel edit",
    rollbackAction: "Rollback",
    rollingBackAction: "Rolling back...",
    addLineAction: "Add line",
    removeLineAction: "Remove line",
    validateImportAction: "Validate file",
    validatingAction: "Validating...",
    commitImportAction: "Commit import",
    committingAction: "Committing...",
    downloadTemplateAction: "Download .xlsx template",
    exportIncompleteAction: "Export incomplete .xlsx",
    resetManualAction: "Reset form",
    searchPlaceholder: "Search by receipt code / supplier...",
    productSearchPlaceholder: "Search products by code/name...",
    emptyHistory: "No procurement receipts yet.",
    emptyValidation: "No import validation result yet.",
    branchMissing: "No active branch context.",
    importHint:
      "Template supports upsert columns: product_code, name, quantity, purchase_price, category_code... Missing product_code will be auto-generated at commit.",
    fields: {
      importBranch: "Import showroom",
      defaultCategoryCode: "Default category",
      defaultCategoryPlaceholder: "Search/select category (default: Other)",
      defaultIsRentable: "Rentable",
      defaultIsSaleable: "Saleable",
      supplierName: "Supplier name",
      supplierPhone: "Supplier phone",
      note: "Note",
      productCode: "Product code",
      productName: "Product name",
      categoryCode: "Category code",
      quantity: "Quantity",
      unitCost: "Purchase price",
      rentPricePerDay: "Rent price",
      salePrice: "Sale price",
      purchasePrice: "Purchase price",
      lineTotal: "Line total",
      itemSize: "Item size",
      paymentExpenseEnabled: "Expense payment completed with receipt",
      paymentMethod: "Payment method",
      paymentAmount: "Expense amount",
      paymentNote: "Payment note",
      fileUpload: "Import file (.xlsx)",
    },
    intakeChannel: {
      manual: "Manual",
      excel: "Import",
    },
    paymentMethods: {
      CASH: "Cash",
      BANK: "Bank transfer",
      MOMO: "MoMo",
    },
    booleanSelect: {
      auto: "Keep default",
      yes: "Yes",
      no: "No",
    },
    rowAction: {
      update: "Update existing",
      create: "Create new",
      generateCode: "Code will be generated",
    },
    errors: {
      invalidLine:
        "Each line requires quantity > 0, rent price >= 0, sale price >= 0, purchase price >= 0, and product_code or name for new product creation.",
      fileRequired: "Please select an .xlsx file before validating/importing.",
      incompleteRowsMissing: "No incomplete rows to export.",
      templateExportFailed: "Template export failed.",
      importCommitFailed: "Import commit failed.",
      rollbackFailed: "Rollback receipt failed.",
      updateFailed: "Update receipt failed.",
      createProductsFailed: "Create products from receipt failed.",
      invalidUpdateLine:
        "Edited line requires quantity > 0, unit cost >= 0 and a resolvable product.",
      immutableReceipt:
        "Created receipts are immutable. Quantity/cost cannot be edited in place; rollback and recreate instead.",
      rollbackRequired:
        "Quantity correction must use receipt rollback + recreate flow.",
      rollbackForbidden: "You do not have permission to rollback this receipt.",
      rollbackAlreadyDone: "This receipt has already been rolled back.",
      rollbackBlockedByItemState:
        "Rollback is blocked because some items are in protected statuses (reserved/on-rent/sold).",
      rollbackBlockedByItemUsage:
        "Rollback is blocked because items were sold/rented before or are already referenced by reservations/maintenance/incidents.",
      rollbackItemMismatch:
        "Rollback is blocked because actual items do not match receipt quantity.",
    },
    summary: {
      totalRows: "Total rows",
      validRows: "Valid",
      invalidRows: "Invalid",
      commitSummary: "Commit summary",
      successRows: "success",
      incompleteRows: "incomplete",
      productsCount: "Products",
    },
    table: {
      sheet: "Sheet",
      row: "Row",
      column: "Column",
      code: "Code",
      message: "Message",
      action: "Action",
      reason: "Reason",
      name: "Name",
      channel: "Channel",
      quantityShort: "Qty",
      costShort: "Cost",
      expenseShort: "Expense",
      created: "Created",
      stock: "Stock",
      purchase: "Purchase",
    },
    pagination: {
      prev: "Prev",
      next: "Next",
    },
  },
};

function triggerBrowserDownload(payload: { blob: Blob; fileName: string }) {
  const url = URL.createObjectURL(payload.blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = payload.fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function resolveProcurementActionErrorMessage(
  error: unknown,
  copy: ProcurementPageCopy,
  fallback: string
): string {
  if (!(error instanceof Error)) return fallback;

  if (error.message === "PROCUREMENT_RECEIPT_IMMUTABLE") {
    return copy.errors.immutableReceipt;
  }
  if (error.message === "FORBIDDEN_PROCUREMENT_ROLLBACK") {
    return copy.errors.rollbackForbidden;
  }
  if (error.message === "PROCUREMENT_RECEIPT_ALREADY_ROLLED_BACK") {
    return copy.errors.rollbackAlreadyDone;
  }
  if (error.message === "PROCUREMENT_RECEIPT_ROLLBACK_ITEM_STATUS_BLOCKED") {
    return copy.errors.rollbackBlockedByItemState;
  }
  if (error.message === "PROCUREMENT_RECEIPT_ROLLBACK_ITEM_IN_USE") {
    return copy.errors.rollbackBlockedByItemUsage;
  }
  if (error.message === "PROCUREMENT_RECEIPT_ROLLBACK_ITEM_COUNT_MISMATCH") {
    return copy.errors.rollbackItemMismatch;
  }
  if (error.message === "PRODUCT_ITEM_DELETE_FORBIDDEN_FINANCIAL_LINKS") {
    return copy.errors.rollbackRequired;
  }
  if (error.message === "INVALID_LINE_PAYLOAD") {
    return copy.errors.invalidUpdateLine;
  }

  return error.message || fallback;
}

export function useProcurementPage(locale: AppLocale) {
  const copy = PROCUREMENT_COPY[locale];
  const { currentBranchId, branchAccess } = useAuthAccess();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [productSearch, setProductSearch] = useState("");
  const [selectedHistoryReceiptId, setSelectedHistoryReceiptId] = useState<string | null>(null);
  const [editingReceiptId, setEditingReceiptId] = useState<string | null>(null);
  const [editSupplierName, setEditSupplierName] = useState("");
  const [editSupplierPhone, setEditSupplierPhone] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editExpenseMethod, setEditExpenseMethod] = useState<OrderPaymentMethod>("CASH");
  const [editExpenseAmountInput, setEditExpenseAmountInput] = useState("");
  const [editExpenseNote, setEditExpenseNote] = useState("");
  const [editLines, setEditLines] = useState<EditReceiptLineDraft[]>([]);

  const [supplierName, setSupplierName] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [note, setNote] = useState("");
  const [manualLines, setManualLines] = useState<ManualLineDraft[]>([createLineDraft()]);

  const [enableExpensePayment, setEnableExpensePayment] = useState(true);
  const [expenseMethod, setExpenseMethod] = useState<OrderPaymentMethod>("CASH");
  const [expenseAmountInput, setExpenseAmountInput] = useState("");
  const [expenseNote, setExpenseNote] = useState("");

  const [importBranchId, setImportBranchId] = useState<string | null>(currentBranchId);
  const [defaultCategoryInput, setDefaultCategoryInput] = useState("");
  const [defaultIsRentableFlag, setDefaultIsRentableFlag] =
    useState<TernaryFlag>("TRUE");
  const [defaultIsSaleableFlag, setDefaultIsSaleableFlag] =
    useState<TernaryFlag>("TRUE");
  const [importFile, setImportFile] = useState<File | null>(null);
  const effectiveImportBranchId = importBranchId ?? currentBranchId;

  const receiptsQuery = useProcurementReceiptsQuery({
    branchId: currentBranchId,
    search,
    page,
    pageSize: PAGE_SIZE,
  });
  const receiptDetailQuery = useProcurementReceiptDetailQuery(
    selectedHistoryReceiptId,
    currentBranchId,
    Boolean(selectedHistoryReceiptId)
  );

  const productsQuery = useProcurementProductsQuery({
    branchId: currentBranchId,
    search: productSearch,
    page: 1,
    pageSize: 100,
  });

  const categoriesQuery = useProcurementCategoriesQuery({
    branchId: effectiveImportBranchId,
    search: null,
  });

  const createMutation = useCreateProcurementReceiptMutation();
  const rollbackMutation = useRollbackProcurementReceiptMutation();
  const updateMutation = useUpdateProcurementReceiptMutation();
  const createProductsMutation = useCreateProductsFromProcurementReceiptMutation();
  const validateImportMutation = useValidateProcurementImportMutation();
  const commitImportMutation = useCommitProcurementImportMutation();
  const exportTemplateMutation = useExportProcurementTemplateMutation();
  const exportIncompleteMutation = useExportProcurementIncompleteRowsMutation();

  const listItems = procurementStore.listItems;
  const listTotal = procurementStore.listTotal;
  const productOptions = procurementStore.productOptions;
  const categoryOptions = procurementStore.categoryOptions;
  const lastImportValidation = procurementStore.lastImportValidation;
  const lastImportCommitResult = procurementStore.lastImportCommitResult;

  const productByCodeLower = useMemo(
    () =>
      new Map(
        productOptions
          .filter((entry) => entry.productCode)
          .map((entry) => [entry.productCode.toLowerCase(), entry])
      ),
    [productOptions]
  );

  const totalPages = useMemo(() => {
    if (listTotal <= 0) return 1;
    return Math.max(1, Math.ceil(listTotal / PAGE_SIZE));
  }, [listTotal]);

  const manualTotals = useMemo(() => {
    let totalQuantity = 0;
    let totalCostAmount = 0;

    for (const line of manualLines) {
      const quantity = parseQuantity(line.quantityInput);
      const unitCost = parseMoney(line.unitCostInput);
      if (!quantity || unitCost === null) continue;
      totalQuantity += quantity;
      totalCostAmount += quantity * unitCost;
    }

    return {
      totalQuantity,
      totalCostAmount,
    };
  }, [manualLines]);

  const fallbackDefaultCategory = useMemo(() => {
    const fallbackCode = resolveOtherCategoryCode(categoryOptions);
    if (!fallbackCode) return null;

    return (
      categoryOptions.find(
        (entry) => normalizeSearchToken(entry.code) === normalizeSearchToken(fallbackCode)
      ) ?? null
    );
  }, [categoryOptions]);

  const defaultCategoryCode = useMemo(() => {
    const resolved = resolveCategoryCodeFromInput(defaultCategoryInput, categoryOptions);
    if (resolved) return resolved;
    return fallbackDefaultCategory?.code ?? "";
  }, [categoryOptions, defaultCategoryInput, fallbackDefaultCategory]);

  const defaultCategoryDisplayInput = useMemo(() => {
    const trimmed = defaultCategoryInput.trim();
    if (trimmed) return trimmed;
    return fallbackDefaultCategory?.name ?? "";
  }, [defaultCategoryInput, fallbackDefaultCategory]);

  const onDefaultCategoryInputChange = (value: string) => {
    setDefaultCategoryInput(value);
  };

  const onImportBranchChange = (branchId: string | null) => {
    setImportBranchId(branchId);
    setDefaultCategoryInput("");
  };

  const resetManualForm = () => {
    setSupplierName("");
    setSupplierPhone("");
    setNote("");
    setManualLines([createLineDraft()]);
    setEnableExpensePayment(true);
    setExpenseMethod("CASH");
    setExpenseAmountInput("");
    setExpenseNote("");
  };

  const addManualLine = () => {
    setManualLines((prev) => [...prev, createLineDraft()]);
  };

  const removeManualLine = (lineId: string) => {
    setManualLines((prev) => {
      const next = prev.filter((line) => line.id !== lineId);
      return next.length > 0 ? next : [createLineDraft()];
    });
  };

  const updateManualLine = (
    lineId: string,
    patch: Partial<Omit<ManualLineDraft, "id">>
  ) => {
    setManualLines((prev) =>
      prev.map((line) => (line.id === lineId ? { ...line, ...patch } : line))
    );
  };

  const getMatchedProductByCode = (productCodeInput: string) => {
    const normalized = productCodeInput.trim().toLowerCase();
    if (!normalized) return null;
    return productByCodeLower.get(normalized) ?? null;
  };

  const buildManualPayload = () => {
    const lines = manualLines
      .map((line) => {
        const quantity = parseQuantity(line.quantityInput);
        const unitCostAmount = parseMoney(line.unitCostInput);
        const rentPricePerDay = parseMoney(line.rentPricePerDayInput);
        const salePrice = parseMoney(line.salePriceInput);
        const purchasePrice = parseMoney(line.purchasePriceInput);
        const productCode = line.productCodeInput.trim() || null;
        const name = line.nameInput.trim() || null;
        const matchedProduct = productCode ? getMatchedProductByCode(productCode) : null;

        if (
          !quantity ||
          unitCostAmount === null ||
          rentPricePerDay === null ||
          salePrice === null ||
          purchasePrice === null
        ) {
          return null;
        }

        if (!matchedProduct && !name) {
          return null;
        }

        return {
          productId: matchedProduct?.id ?? null,
          productCode,
          name,
          categoryCode: line.categoryCodeInput.trim() || null,
          rentPricePerDay,
          salePrice,
          purchasePrice,
          quantity,
          unitCostAmount,
          itemSize: line.itemSize.trim() || null,
          note: line.note.trim() || null,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

    if (lines.length !== manualLines.length) {
      return null;
    }

    const expenseAmount = parseMoney(expenseAmountInput);
    const fallbackExpenseAmount = lines.reduce(
      (sum, line) => sum + line.quantity * line.unitCostAmount,
      0
    );

    return {
      branchId: currentBranchId,
      intakeChannel: "MANUAL" as const,
      supplierName: supplierName.trim() || null,
      supplierPhone: supplierPhone.trim() || null,
      note: note.trim() || null,
      lines,
      expensePayment: {
        amount: expenseAmount ?? fallbackExpenseAmount,
        method: expenseMethod,
        note: expenseNote.trim() || null,
        reason: "PROCUREMENT_INTAKE_EXPENSE",
      },
    };
  };

  const createManualReceipt = async () => {
    const payload = buildManualPayload();
    if (!payload) {
      throw new Error(copy.errors.invalidLine);
    }

    return createMutation.mutateAsync(payload);
  };

  const rollbackReceipt = async (receiptId: string, reason?: string | null) => {
    return rollbackMutation.mutateAsync({
      receiptId,
      payload: {
        reason: reason?.trim() || null,
      },
    });
  };

  const startEditingReceipt = async (receiptId: string) => {
    setSelectedHistoryReceiptId(receiptId);
    setEditingReceiptId(receiptId);

    const detail =
      receiptDetailQuery.data && receiptDetailQuery.data.summary.id === receiptId
        ? receiptDetailQuery.data
        : await fetchProcurementReceiptDetailById(queryClient, {
            receiptId,
            branchId: currentBranchId,
          });

    setEditSupplierName(detail.summary.supplierName ?? "");
    setEditSupplierPhone(detail.summary.supplierPhone ?? "");
    setEditNote(detail.summary.note ?? "");
    setEditExpenseMethod(detail.summary.paymentMethod ?? "CASH");
    setEditExpenseAmountInput(String(detail.summary.paymentExpenseAmount));
    setEditExpenseNote(detail.summary.paymentNote ?? "");
    setEditLines(
      detail.lines.map((line) => ({
        id: line.id,
        productId: line.productId ?? "",
        productCode: line.productCodeSnapshot ?? "",
        productName: line.productNameSnapshot ?? "",
        quantityInput: String(line.quantity),
        unitCostInput: String(line.unitCostAmount),
        rentPricePerDayInput: String(line.rentPricePerDay ?? 0),
        quickRentPriceInput:
          line.quickRentPrice === null ? "" : String(line.quickRentPrice),
        purchasePriceInput: String(line.purchasePrice ?? line.unitCostAmount),
        salePriceInput: String(line.salePrice ?? 0),
        categoryCodeInput: line.categoryCodeSnapshot ?? "",
        itemSizeInput: line.itemSize ?? "",
        noteInput: line.note ?? "",
      }))
    );
  };

  const cancelEditingReceipt = () => {
    setEditingReceiptId(null);
    setEditExpenseMethod("CASH");
    setEditExpenseAmountInput("");
    setEditExpenseNote("");
    setEditLines([]);
  };

  const updateEditLine = (lineId: string, patch: Partial<Omit<EditReceiptLineDraft, "id">>) => {
    setEditLines((previous) =>
      previous.map((line) => (line.id === lineId ? { ...line, ...patch } : line))
    );
  };

  const saveReceiptEdit = async () => {
    if (!editingReceiptId) {
      throw new Error(copy.errors.updateFailed);
    }

    const lines = editLines
      .map((line) => {
        const quantity = parseQuantity(line.quantityInput);
        const unitCostAmount = parseMoney(line.unitCostInput);
        const rentPricePerDay = parseMoney(line.rentPricePerDayInput);
        const purchasePrice = parseMoney(line.purchasePriceInput);
        const salePrice = parseMoney(line.salePriceInput);
        const quickRentPrice = parseMoney(line.quickRentPriceInput);
        if (
          !quantity ||
          unitCostAmount === null ||
          rentPricePerDay === null ||
          purchasePrice === null ||
          salePrice === null
        ) {
          return null;
        }

        return {
          productId: line.productId || null,
          productCode: line.productCode || null,
          name: line.productName || null,
          categoryCode: line.categoryCodeInput.trim() || null,
          rentPricePerDay,
          quickRentPrice,
          purchasePrice,
          salePrice,
          quantity,
          unitCostAmount,
          itemSize: line.itemSizeInput.trim() || null,
          note: line.noteInput.trim() || null,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

    if (lines.length !== editLines.length || lines.length === 0) {
      throw new Error(copy.errors.invalidUpdateLine);
    }

    const nextExpenseAmount =
      parseMoney(editExpenseAmountInput) ??
      lines.reduce((sum, line) => sum + line.quantity * line.unitCostAmount, 0);

    const detail = await updateMutation.mutateAsync({
      receiptId: editingReceiptId,
      payload: {
        supplierName: editSupplierName.trim() || null,
        supplierPhone: editSupplierPhone.trim() || null,
        note: editNote.trim() || null,
        lines,
        expensePayment: {
          amount: nextExpenseAmount,
          method: editExpenseMethod,
          note: editExpenseNote.trim() || null,
          reason: "PROCUREMENT_INTAKE_EXPENSE",
        },
      },
    });

    setEditingReceiptId(null);
    return detail;
  };

  const createProductsFromReceipt = async (receiptId: string) => {
    return createProductsMutation.mutateAsync(receiptId);
  };

  const onImportFileSelected = async (file: File | null) => {
    setImportFile(file);
  };

  const validateImport = async () => {
    if (!importFile) {
      throw new Error(copy.errors.fileRequired);
    }

    return validateImportMutation.mutateAsync({
      branchId: effectiveImportBranchId,
      file: importFile,
      context: {
        defaultCategoryCode: defaultCategoryCode.trim() || null,
        defaultIsRentable: ternaryToBoolean(defaultIsRentableFlag),
        defaultIsSaleable: ternaryToBoolean(defaultIsSaleableFlag),
      },
    });
  };

  const commitImport = async () => {
    if (!importFile) {
      throw new Error(copy.errors.fileRequired);
    }

    const expenseAmount = parseMoney(expenseAmountInput);
    const fallbackExpenseAmount = (lastImportValidation?.normalizedRows ?? []).reduce(
      (sum, row) => sum + row.lineTotalAmount,
      0
    );

    return commitImportMutation.mutateAsync({
      branchId: effectiveImportBranchId,
      file: importFile,
      context: {
        defaultCategoryCode: defaultCategoryCode.trim() || null,
        defaultIsRentable: ternaryToBoolean(defaultIsRentableFlag),
        defaultIsSaleable: ternaryToBoolean(defaultIsSaleableFlag),
      },
      intakeSourceFileName: importFile.name,
      supplierName: supplierName.trim() || null,
      supplierPhone: supplierPhone.trim() || null,
      note: note.trim() || null,
      expensePayment: {
        amount: expenseAmount ?? fallbackExpenseAmount,
        method: expenseMethod,
        note: expenseNote.trim() || null,
        reason: "PROCUREMENT_INTAKE_EXPENSE",
      },
    });
  };

  const exportTemplate = async () => {
    const payload = await exportTemplateMutation.mutateAsync({
      branchId: effectiveImportBranchId,
      locale,
    });
    triggerBrowserDownload(payload);
  };

  const exportIncompleteRows = async () => {
    const rows = lastImportCommitResult?.incompleteRows ?? [];
    if (rows.length === 0) {
      throw new Error(copy.errors.incompleteRowsMissing);
    }

    const payload = await exportIncompleteMutation.mutateAsync({
      rows,
    });
    triggerBrowserDownload(payload);
  };

  return {
    copy,
    currentBranchId,
    branchAccess,
    search,
    setSearch,
    page,
    setPage,
    totalPages,
    productSearch,
    setProductSearch,
    receiptsQuery,
    selectedHistoryReceiptId,
    setSelectedHistoryReceiptId,
    openHistoryReceiptDetail: (receiptId: string) => setSelectedHistoryReceiptId(receiptId),
    closeHistoryReceiptDetail: () => {
      setSelectedHistoryReceiptId(null);
      setEditingReceiptId(null);
      setEditExpenseMethod("CASH");
      setEditExpenseAmountInput("");
      setEditExpenseNote("");
      setEditLines([]);
    },
    editingReceiptId,
    isEditingReceipt: Boolean(editingReceiptId),
    startEditingReceipt,
    cancelEditingReceipt,
    editSupplierName,
    setEditSupplierName,
    editSupplierPhone,
    setEditSupplierPhone,
    editNote,
    setEditNote,
    editExpenseMethod,
    setEditExpenseMethod,
    editExpenseAmountInput,
    setEditExpenseAmountInput,
    editExpenseNote,
    setEditExpenseNote,
    editLines,
    updateEditLine,
    saveReceiptEdit,
    updateMutation,
    createProductsFromReceipt,
    createProductsMutation,
    receiptDetailQuery,
    productsQuery,
    categoriesQuery,
    listItems,
    productOptions,
    categoryOptions,
    listTotal,
    manualLines,
    addManualLine,
    removeManualLine,
    updateManualLine,
    getMatchedProductByCode,
    supplierName,
    setSupplierName,
    supplierPhone,
    setSupplierPhone,
    note,
    setNote,
    enableExpensePayment,
    setEnableExpensePayment,
    expenseMethod,
    setExpenseMethod,
    expenseAmountInput,
    setExpenseAmountInput,
    expenseNote,
    setExpenseNote,
    manualTotals,
    resetManualForm,
    createManualReceipt,
    createMutation,
    rollbackReceipt,
    rollbackMutation,
    importBranchId: effectiveImportBranchId,
    onImportBranchChange,
    defaultCategoryInput: defaultCategoryDisplayInput,
    onDefaultCategoryInputChange,
    defaultCategoryCode,
    defaultIsRentableFlag,
    setDefaultIsRentableFlag,
    defaultIsSaleableFlag,
    setDefaultIsSaleableFlag,
    importFile,
    importFileName: importFile?.name ?? null,
    onImportFileSelected,
    validateImport,
    commitImport,
    validateImportMutation,
    commitImportMutation,
    lastImportValidation,
    lastImportCommitResult,
    exportTemplate,
    exportTemplateMutation,
    exportIncompleteRows,
    exportIncompleteMutation,
    resolveActionErrorMessage: (error: unknown, fallback: string) =>
      resolveProcurementActionErrorMessage(error, copy, fallback),
  };
}
