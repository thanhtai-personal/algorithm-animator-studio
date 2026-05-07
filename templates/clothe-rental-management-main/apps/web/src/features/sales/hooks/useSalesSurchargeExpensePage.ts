"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { AppLocale } from "@/constants/locale";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import { paymentsClientService } from "@/features/payments/services/paymentsClientService";
import { useCreateSalesPosManualPaymentMutation } from "@/features/sales/queries/useSalesQueries";
import type { PosManualPaymentType } from "@/types/paymentsDomain";
import type { OrderPaymentMethod } from "@/types/ordersDomain";
import { formatMoney } from "@/utils/format/money";

interface SalesSurchargeExpenseCopy {
  title: string;
  subtitle: string;
  typeLabel: string;
  typeFee: string;
  typeExpense: string;
  amountLabel: string;
  methodLabel: string;
  reasonLabel: string;
  noteLabel: string;
  importOrderLabel: string;
  initialCapitalLabel: string;
  receiptLabel: string;
  receiptHint: string;
  receiptSelectAction: string;
  receiptPickerTitle: string;
  receiptPickerDescription: string;
  receiptCameraAction: string;
  receiptUploadAction: string;
  receiptPickerCloseAction: string;
  receiptRemoveAction: string;
  receiptInvalidType: string;
  receiptTooLarge: string;
  receiptTooMany: string;
  submitAction: string;
  processing: string;
  branchMissing: string;
  amountInvalid: string;
  reasonRequired: string;
  successFee: string;
  successExpense: string;
  latestLabel: string;
}

export interface PendingPaymentReceiptFile {
  id: string;
  file: File;
  name: string;
  sizeBytes: number;
  previewUrl: string;
}

const COPY: Record<AppLocale, SalesSurchargeExpenseCopy> = {
  vi: {
    title: "Phụ thu / phụ chi tại POS",
    subtitle:
      "Ghi nhận nhanh các khoản thu thêm hoặc chi ngoài đơn hàng để đồng bộ báo cáo doanh thu và đối soát.",
    typeLabel: "Loại giao dịch",
    typeFee: "Phụ thu",
    typeExpense: "Phụ chi",
    amountLabel: "Số tiền",
    methodLabel: "Phương thức",
    reasonLabel: "Lý do",
    noteLabel: "Ghi chú",
    importOrderLabel: "Đơn nhập hàng",
    initialCapitalLabel: "Vốn ban đầu",
    receiptLabel: "Ảnh chứng từ/hóa đơn",
    receiptHint:
      "Nên tải hóa đơn cho khoản chi lớn để chủ cửa hàng kiểm tra từ xa.",
    receiptSelectAction: "Tải ảnh chứng từ",
    receiptPickerTitle: "Thêm ảnh chứng từ",
    receiptPickerDescription: "Chọn chụp ảnh mới hoặc tải ảnh hóa đơn có sẵn từ thiết bị.",
    receiptCameraAction: "Chụp ảnh bằng camera",
    receiptUploadAction: "Tải ảnh từ thiết bị",
    receiptPickerCloseAction: "Đóng",
    receiptRemoveAction: "Xóa",
    receiptInvalidType: "Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.",
    receiptTooLarge: "Mỗi ảnh chứng từ tối đa 5MB.",
    receiptTooMany: "Tối đa 3 ảnh chứng từ cho mỗi payment.",
    submitAction: "Xác nhận",
    processing: "Đang lưu...",
    branchMissing: "Thiếu ngữ cảnh chi nhánh.",
    amountInvalid: "Số tiền phải lớn hơn 0.",
    reasonRequired: "Lý do là bắt buộc.",
    successFee: "Đã tạo phụ thu.",
    successExpense: "Đã tạo phụ chi.",
    latestLabel: "Giao dịch vừa tạo",
  },
  en: {
    title: "POS surcharge / expense",
    subtitle:
      "Quickly record extra inflow/outflow outside order flow and keep revenue/reconciliation charts in sync.",
    typeLabel: "Transaction type",
    typeFee: "Surcharge",
    typeExpense: "Expense",
    amountLabel: "Amount",
    methodLabel: "Method",
    reasonLabel: "Reason",
    noteLabel: "Note",
    importOrderLabel: "Import order",
    initialCapitalLabel: "Initial capital",
    receiptLabel: "Receipt / invoice photos",
    receiptHint:
      "Attach invoices for larger expenses so owners can review them remotely.",
    receiptSelectAction: "Upload receipt photos",
    receiptPickerTitle: "Add receipt photos",
    receiptPickerDescription: "Take a new photo or upload an existing receipt image from this device.",
    receiptCameraAction: "Take photo with camera",
    receiptUploadAction: "Upload from device",
    receiptPickerCloseAction: "Close",
    receiptRemoveAction: "Remove",
    receiptInvalidType: "Only JPG, PNG, or WebP images are supported.",
    receiptTooLarge: "Each receipt image can be up to 5MB.",
    receiptTooMany: "Attach up to 3 receipt images per payment.",
    submitAction: "Submit",
    processing: "Saving...",
    branchMissing: "Missing branch context.",
    amountInvalid: "Amount must be greater than 0.",
    reasonRequired: "Reason is required.",
    successFee: "Surcharge recorded.",
    successExpense: "Expense recorded.",
    latestLabel: "Latest entry",
  },
};

const RECEIPT_ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const RECEIPT_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const RECEIPT_MAX_FILES = 3;

function parsePositiveMoney(value: string): number {
  const parsed = Number(value.trim().replace(/,/g, ""));
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return parsed;
}

export function useSalesSurchargeExpensePage(locale: AppLocale) {
  const copy = COPY[locale];
  const { currentBranchId } = useAuthAccess();
  const createManualPaymentMutation = useCreateSalesPosManualPaymentMutation();

  const [type, setType] = useState<PosManualPaymentType>("FEE");
  const [amountInput, setAmountInput] = useState("0");
  const [method, setMethod] = useState<OrderPaymentMethod>("CASH");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [isImportOrder, setIsImportOrder] = useState(false);
  const [isInitialCapital, setIsInitialCapital] = useState(false);
  const [receiptFiles, setReceiptFiles] = useState<PendingPaymentReceiptFile[]>([]);
  const receiptFilesRef = useRef<PendingPaymentReceiptFile[]>([]);

  const latestEntry = createManualPaymentMutation.data ?? null;

  useEffect(() => {
    receiptFilesRef.current = receiptFiles;
  }, [receiptFiles]);

  useEffect(() => {
    return () => {
      receiptFilesRef.current.forEach((entry) => URL.revokeObjectURL(entry.previewUrl));
    };
  }, []);

  const methodOptions = useMemo(
    () => [
      { value: "CASH", label: "CASH" },
      { value: "BANK", label: "BANK" },
      { value: "MOMO", label: "MOMO" },
    ] as const,
    []
  );

  const onSubmit = async () => {
    if (!currentBranchId) {
      toast.error(copy.branchMissing);
      return;
    }

    const amount = parsePositiveMoney(amountInput);
    if (amount <= 0) {
      toast.error(copy.amountInvalid);
      return;
    }

    const normalizedReason = reason.trim();
    if (!normalizedReason) {
      toast.error(copy.reasonRequired);
      return;
    }

    try {
      const receiptUploadSessionIds = await Promise.all(
        receiptFiles.map(async (entry) => {
          const uploaded = await paymentsClientService.uploadPaymentReceiptFile({
            branchId: currentBranchId,
            file: entry.file,
          });
          return uploaded.uploadSessionId;
        })
      );

      await createManualPaymentMutation.mutateAsync({
        branchId: currentBranchId,
        type,
        method,
        amount,
        reason: normalizedReason,
        note: note.trim() || undefined,
        isImportOrder: type === "EXPENSE" ? isImportOrder : false,
        isInitialCapital,
        receiptUploadSessionIds,
      });

      setAmountInput("0");
      setReason("");
      setNote("");
      setIsImportOrder(false);
      setIsInitialCapital(false);
      setReceiptFiles((current) => {
        current.forEach((entry) => URL.revokeObjectURL(entry.previewUrl));
        return [];
      });
      toast.success(type === "FEE" ? copy.successFee : copy.successExpense);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Request failed";
      toast.error(message);
    }
  };

  const addReceiptFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const nextFiles = Array.from(fileList);
    if (receiptFiles.length + nextFiles.length > RECEIPT_MAX_FILES) {
      toast.error(copy.receiptTooMany);
      return;
    }

    const accepted: PendingPaymentReceiptFile[] = [];
    for (const file of nextFiles) {
      if (!RECEIPT_ALLOWED_MIME_TYPES.has(file.type)) {
        toast.error(copy.receiptInvalidType);
        continue;
      }
      if (file.size > RECEIPT_MAX_FILE_SIZE_BYTES) {
        toast.error(copy.receiptTooLarge);
        continue;
      }
      accepted.push({
        id: `${Date.now()}-${file.name}-${file.size}`,
        file,
        name: file.name,
        sizeBytes: file.size,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (accepted.length === 0) return;
    setReceiptFiles((current) => [...current, ...accepted]);
  };

  const removeReceiptFile = (id: string) => {
    setReceiptFiles((current) => {
      const removed = current.find((entry) => entry.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((entry) => entry.id !== id);
    });
  };

  return {
    copy,
    type,
    setType,
    amountInput,
    setAmountInput,
    method,
    setMethod,
    methodOptions,
    reason,
    setReason,
    note,
    setNote,
    isImportOrder,
    setIsImportOrder,
    isInitialCapital,
    setIsInitialCapital,
    receiptFiles,
    addReceiptFiles,
    removeReceiptFile,
    latestEntry,
    submitting: createManualPaymentMutation.isPending,
    onSubmit,
    formatMoneyLabel: (value: number) =>
      formatMoney(value, { locale, currency: "VND" }) || "0",
  };
}
