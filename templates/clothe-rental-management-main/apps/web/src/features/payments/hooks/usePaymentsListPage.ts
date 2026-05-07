"use client";

import { useMemo, useState } from "react";
import type { AppLocale } from "@/constants/locale";
import {
  PAYMENTS_DEFAULT_PAGE_SIZE,
  PAYMENTS_FILTER_METHODS,
  PAYMENTS_FILTER_TYPES,
} from "@/features/payments/constants";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import {
  useExportPaymentsCsvMutation,
  usePaymentsListQuery,
  useUploadPaymentReceiptFilesMutation,
  useUpdatePaymentMutation,
  useUpdatePaymentStatusMutation,
} from "@/features/payments/queries/usePaymentsQueries";
import { paymentsStore } from "@/features/payments/stores/paymentsStore";
import type {
  OrderPaymentMethod,
  OrderPaymentStatus,
  OrderPaymentType,
} from "@/types/ordersDomain";
import { buildDomainLabels } from "@/utils/domainLabels";

interface PaymentsListCopy {
  title: string;
  subtitle: string;
  exportAction: string;
  exportRestricted: string;
  resetFilters: string;
  statusPolicyTitle: string;
  statusPolicyBody: string;
  conventionTitle: string;
  conventionBody: string;
  dateRangeFilterLabel: string;
  typeFilterLabel: string;
  methodFilterLabel: string;
  branchFilterLabel: string;
  allTypes: string;
  allMethods: string;
  allBranches: string;
  tableHeaders: {
    createdAt: string;
    details: string;
    status: string;
    amount: string;
    createdBy: string;
    reason: string;
    note: string;
    actions: string;
  };
  detailLabels: {
    orderCode: string;
    customer: string;
    type: string;
    method: string;
  };
  loading: string;
  empty: string;
  pageLabel: string;
  prevPage: string;
  nextPage: string;
  viewOrder: string;
  noOrder: string;
  noCreator: string;
  noCustomer: string;
  actionFailed: string;
  voidAction: string;
  repostAction: string;
  voidReasonPrompt: string;
  editDrawerTitle: string;
  editDrawerDescription: string;
  editAction: string;
  saveAction: string;
  cancelAction: string;
  closeAction: string;
  editNotAllowedHint: string;
  amountRequired: string;
  reasonRequired: string;
  referenceCodeLabel: string;
  receiptLabel: string;
  receiptSelectAction: string;
  receiptPickerTitle: string;
  receiptPickerDescription: string;
  receiptCameraAction: string;
  receiptUploadAction: string;
  receiptPickerCloseAction: string;
  receiptPendingLabel: string;
  receiptRemoveAction: string;
  receiptInvalidType: string;
  receiptTooLarge: string;
  receiptTooMany: string;
  importOrderLabel: string;
  initialCapitalLabel: string;
  totalsTitle: string;
  totalsByMethod: string;
  totalsByType: string;
  grossInflow: string;
  grossRefund: string;
  netTotal: string;
  postedCount: string;
  cashbookTitle: string;
  cashbookEmpty: string;
  cashbookDate: string;
  canEditStatusHint: string;
}

const ORDER_PAYMENT_TYPE_LABEL_KEYS: Record<OrderPaymentType, string> = {
  RENT: "paymentType.rent",
  DEPOSIT: "paymentType.deposit",
  FEE: "paymentType.fee",
  REFUND: "paymentType.refund",
  EXPENSE: "paymentType.expense",
};

const ORDER_PAYMENT_METHOD_LABEL_KEYS: Record<OrderPaymentMethod, string> = {
  CASH: "paymentMethod.cash",
  BANK: "paymentMethod.bank",
  MOMO: "paymentMethod.momo",
};

const ORDER_PAYMENT_STATUS_LABEL_KEYS: Record<OrderPaymentStatus, string> = {
  POSTED: "paymentStatus.posted",
  VOIDED: "paymentStatus.voided",
};

const PAYMENTS_LIST_COPY: Record<AppLocale, PaymentsListCopy> = {
  vi: {
    title: "Thanh toán",
    subtitle:
      "Đối soát payment thủ công theo ngày, phương thức và loại giao dịch.",
    exportAction: "Export CSV",
    exportRestricted: "Chỉ Manager trở lên mới export CSV.",
    resetFilters: "Xóa bộ lọc",
    statusPolicyTitle: "Policy chỉnh sửa payment",
    statusPolicyBody:
      "MVP không cho sửa/xóa trực tiếp. Dùng trạng thái đã hủy + tạo bản ghi mới để giữ audit.",
    conventionTitle: "Convention hạch toán",
    conventionBody:
      "amount lưu dương. REFUND và EXPENSE được xem là outflow khi tính net đối soát (signed amount âm).",
    dateRangeFilterLabel: "Khoảng ngày",
    typeFilterLabel: "Loại",
    methodFilterLabel: "Phương thức",
    branchFilterLabel: "Chi nhánh",
    allTypes: "Tất cả loại",
    allMethods: "Tất cả phương thức",
    allBranches: "Tất cả chi nhánh",
    tableHeaders: {
      createdAt: "Thời gian",
      details: "Thông tin",
      status: "Trạng thái",
      amount: "Số tiền",
      createdBy: "Người tạo",
      reason: "Lý do",
      note: "Ghi chú",
      actions: "Thao tác",
    },
    detailLabels: {
      orderCode: "Mã đơn",
      customer: "Khách hàng",
      type: "Loại",
      method: "Phương thức",
    },
    loading: "Đang tải danh sách payment...",
    empty: "Không có payment phù hợp bộ lọc hiện tại.",
    pageLabel: "Trang",
    prevPage: "Trước",
    nextPage: "Sau",
    viewOrder: "Mở đơn",
    noOrder: "Không có đơn",
    noCreator: "Không rõ",
    noCustomer: "Khách lẻ",
    actionFailed: "Thao tác payment thất bại.",
    voidAction: "Xóa",
    repostAction: "Repost",
    voidReasonPrompt: "Nhập lý do xóa (tùy chọn)",
    editDrawerTitle: "Sửa payment",
    editDrawerDescription: "Cập nhật thông tin payment thủ công.",
    editAction: "Sửa",
    saveAction: "Lưu",
    cancelAction: "Hủy",
    closeAction: "Đóng",
    editNotAllowedHint: "Chỉ Manager trở lên được sửa payment.",
    amountRequired: "Số tiền phải lớn hơn 0.",
    reasonRequired: "Lý do là bắt buộc.",
    referenceCodeLabel: "Mã tham chiếu",
    receiptLabel: "Ảnh hóa đơn/chuyển khoản",
    receiptSelectAction: "Bổ sung ảnh",
    receiptPickerTitle: "Bổ sung ảnh payment",
    receiptPickerDescription: "Chọn chụp ảnh mới hoặc tải ảnh hóa đơn/chuyển khoản có sẵn.",
    receiptCameraAction: "Chụp ảnh bằng camera",
    receiptUploadAction: "Tải ảnh từ thiết bị",
    receiptPickerCloseAction: "Đóng",
    receiptPendingLabel: "Ảnh chờ lưu",
    receiptRemoveAction: "Xóa",
    receiptInvalidType: "Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.",
    receiptTooLarge: "Mỗi ảnh tối đa 5MB.",
    receiptTooMany: "Mỗi payment tối đa 3 ảnh chứng từ.",
    importOrderLabel: "Đơn nhập hàng",
    initialCapitalLabel: "Vốn ban đầu",
    totalsTitle: "Tổng hợp đối soát (chỉ POSTED)",
    totalsByMethod: "Theo phương thức (net)",
    totalsByType: "Theo loại giao dịch",
    grossInflow: "Thu vào",
    grossRefund: "Hoàn ra",
    netTotal: "Thuần",
    postedCount: "Số giao dịch",
    cashbookTitle: "Sổ thu chi theo ngày",
    cashbookEmpty: "Chưa có dữ liệu cashbook trong bộ lọc.",
    cashbookDate: "Ngày",
    canEditStatusHint: "Chỉ Admin được đổi trạng thái payment thủ công.",
  },
  en: {
    title: "Payments",
    subtitle: "Reconcile manual payments by date, method, and payment type.",
    exportAction: "Export CSV",
    exportRestricted: "Only Manager+ can export CSV.",
    resetFilters: "Reset filters",
    statusPolicyTitle: "Payment correction policy",
    statusPolicyBody:
      "MVP disallows direct edit/delete. Mark as deleted and create a new record for audit safety.",
    conventionTitle: "Posting convention",
    conventionBody:
      "Amount is always stored as positive. REFUND and EXPENSE are treated as outflow in net reconciliation (negative signed amount).",
    dateRangeFilterLabel: "Date range",
    typeFilterLabel: "Type",
    methodFilterLabel: "Method",
    branchFilterLabel: "Branch",
    allTypes: "All types",
    allMethods: "All methods",
    allBranches: "All branches",
    tableHeaders: {
      createdAt: "Created at",
      details: "Details",
      status: "Status",
      amount: "Amount",
      createdBy: "Created by",
      reason: "Reason",
      note: "Note",
      actions: "Actions",
    },
    detailLabels: {
      orderCode: "Order",
      customer: "Customer",
      type: "Type",
      method: "Method",
    },
    loading: "Loading payments...",
    empty: "No payments matched current filters.",
    pageLabel: "Page",
    prevPage: "Prev",
    nextPage: "Next",
    viewOrder: "Open order",
    noOrder: "No order",
    noCreator: "Unknown",
    noCustomer: "Walk-in",
    actionFailed: "Payment action failed.",
    voidAction: "Delete",
    repostAction: "Repost",
    voidReasonPrompt: "Enter delete reason (optional)",
    editDrawerTitle: "Edit payment",
    editDrawerDescription: "Update manual payment details.",
    editAction: "Edit",
    saveAction: "Save",
    cancelAction: "Cancel",
    closeAction: "Close",
    editNotAllowedHint: "Only Manager+ can edit payments.",
    amountRequired: "Amount must be greater than 0.",
    reasonRequired: "Reason is required.",
    referenceCodeLabel: "Reference code",
    receiptLabel: "Invoice / transfer photos",
    receiptSelectAction: "Add photos",
    receiptPickerTitle: "Add payment photos",
    receiptPickerDescription: "Take a new photo or upload existing invoice/transfer images.",
    receiptCameraAction: "Take photo with camera",
    receiptUploadAction: "Upload from device",
    receiptPickerCloseAction: "Close",
    receiptPendingLabel: "Pending photos",
    receiptRemoveAction: "Remove",
    receiptInvalidType: "Only JPG, PNG, or WebP images are supported.",
    receiptTooLarge: "Each image can be up to 5MB.",
    receiptTooMany: "Attach up to 3 receipt images per payment.",
    importOrderLabel: "Import order",
    initialCapitalLabel: "Initial capital",
    totalsTitle: "Reconciliation totals (POSTED only)",
    totalsByMethod: "By method (net)",
    totalsByType: "By type",
    grossInflow: "Inflow",
    grossRefund: "Refund",
    netTotal: "Net",
    postedCount: "Transactions",
    cashbookTitle: "Daily cashbook",
    cashbookEmpty: "No cashbook rows in current filter.",
    cashbookDate: "Date",
    canEditStatusHint: "Only Admin can manually change payment status.",
  },
};

function isManagerPlusRole(role: string | null | undefined): boolean {
  return role === "owner_admin" || role === "manager";
}

function isStaffRole(role: string | null | undefined): boolean {
  return role === "staff";
}

export function usePaymentsListPage(locale: AppLocale) {
  const copy = PAYMENTS_LIST_COPY[locale];
  const { role, currentBranchId, branchAccess, can } = useAuthAccess();
  const paymentTypeLabels = useMemo(
    () => buildDomainLabels(locale, ORDER_PAYMENT_TYPE_LABEL_KEYS),
    [locale],
  );
  const paymentMethodLabels = useMemo(
    () => buildDomainLabels(locale, ORDER_PAYMENT_METHOD_LABEL_KEYS),
    [locale],
  );
  const paymentStatusLabels = useMemo(
    () => buildDomainLabels(locale, ORDER_PAYMENT_STATUS_LABEL_KEYS),
    [locale],
  );

  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [typeFilter, setTypeFilter] = useState<OrderPaymentType | "">("");
  const [methodFilter, setMethodFilter] = useState<OrderPaymentMethod | "">("");
  const [branchFilter, setBranchFilter] = useState("");
  const [page, setPage] = useState(1);

  const canManagePaymentStatus = can("payments.update_status_manual");
  const canExport = isManagerPlusRole(role);
  const roleIsStaff = isStaffRole(role);

  const resolvedBranchId = roleIsStaff
    ? (currentBranchId ?? null)
    : branchFilter || currentBranchId || null;

  const branchFilterValue = roleIsStaff
    ? (currentBranchId ?? "")
    : branchFilter || currentBranchId || "";

  const listQuery = usePaymentsListQuery({
    branchId: resolvedBranchId,
    startDate: dateRange.startDate || null,
    endDate: dateRange.endDate || null,
    type: typeFilter || null,
    method: methodFilter || null,
    page,
    pageSize: PAYMENTS_DEFAULT_PAGE_SIZE,
  });

  const updateStatusMutation = useUpdatePaymentStatusMutation();
  const updatePaymentMutation = useUpdatePaymentMutation();
  const uploadReceiptFilesMutation = useUploadPaymentReceiptFilesMutation();
  const exportCsvMutation = useExportPaymentsCsvMutation();
  const canEditPayments = isManagerPlusRole(role);

  const totalPages = (() => {
    if (paymentsStore.listTotal <= 0) return 1;
    return Math.max(
      1,
      Math.ceil(paymentsStore.listTotal / paymentsStore.listPageSize),
    );
  })();

  const branchOptions = useMemo(
    () =>
      branchAccess.map((entry) => ({
        value: entry.branchId,
        label: entry.branchName?.trim() || entry.branchId,
      })),
    [branchAccess],
  );

  const resetFilters = () => {
    setDateRange({ startDate: "", endDate: "" });
    setTypeFilter("");
    setMethodFilter("");
    setBranchFilter("");
    setPage(1);
  };

  const exportCsv = async () => {
    const result = await exportCsvMutation.mutateAsync({
      branchId: resolvedBranchId,
      startDate: dateRange.startDate || null,
      endDate: dateRange.endDate || null,
      type: typeFilter || null,
      method: methodFilter || null,
    });

    const url = URL.createObjectURL(result.blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = result.fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return {
    copy,
    paymentTypeLabels,
    paymentMethodLabels,
    paymentStatusLabels,
    typeOptions: PAYMENTS_FILTER_TYPES,
    methodOptions: PAYMENTS_FILTER_METHODS,
    branchOptions,
    dateRange,
    setDateRange: (next: { startDate: string; endDate: string }) => {
      setDateRange(next);
      setPage(1);
    },
    typeFilter,
    setTypeFilter: (value: OrderPaymentType | "") => {
      setTypeFilter(value);
      setPage(1);
    },
    methodFilter,
    setMethodFilter: (value: OrderPaymentMethod | "") => {
      setMethodFilter(value);
      setPage(1);
    },
    branchFilter,
    branchFilterValue,
    setBranchFilter: (value: string) => {
      setBranchFilter(value);
      setPage(1);
    },
    resetFilters,
    page,
    setPage,
    totalPages,
    listQuery,
    listItems: paymentsStore.listItems,
    listTotal: paymentsStore.listTotal,
    totals: paymentsStore.totals,
    dailyCashbook: paymentsStore.dailyCashbook,
    canExport,
    canEditPayments,
    canManagePaymentStatus,
    canSelectBranch: !roleIsStaff,
    updateStatusMutation,
    updatePaymentMutation,
    uploadReceiptFilesMutation,
    exportCsv,
    exportCsvMutation,
  };
}
