"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AppLocale } from "@/constants/locale";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import { useScanInventoryItemMutation } from "@/features/inventory/queries/useInventoryQueries";

interface InventoryScanCopy {
  title: string;
  subtitle: string;
  codeLabel: string;
  codePlaceholder: string;
  submitAction: string;
  recentResult: string;
  itemCode: string;
  status: string;
  openDetail: string;
  notFoundMessage: string;
}

const INVENTORY_SCAN_COPY: Record<AppLocale, InventoryScanCopy> = {
  vi: {
    title: "Quick Scan",
    subtitle: "MVP: nhập mã item hoặc QR để mở nhanh item detail.",
    codeLabel: "Mã item / QR",
    codePlaceholder: "Ví dụ: ITEM-0001 hoặc QR-...",
    submitAction: "Tìm item",
    recentResult: "Kết quả gần nhất",
    itemCode: "Mã item",
    status: "Trạng thái",
    openDetail: "Mở chi tiết",
    notFoundMessage: "Không tìm thấy item theo mã đã nhập.",
  },
  en: {
    title: "Quick Scan",
    subtitle: "MVP input-based scan to open inventory item detail quickly.",
    codeLabel: "Item / QR code",
    codePlaceholder: "Example: ITEM-0001 or QR-...",
    submitAction: "Find item",
    recentResult: "Last result",
    itemCode: "Item code",
    status: "Status",
    openDetail: "Open detail",
    notFoundMessage: "No item found for the entered code.",
  },
};

export function useInventoryScanPage(locale: AppLocale) {
  const router = useRouter();
  const copy = INVENTORY_SCAN_COPY[locale];
  const { currentBranchId } = useAuthAccess();

  const [codeInput, setCodeInput] = useState("");
  const [scanError, setScanError] = useState<string | null>(null);
  const scanMutation = useScanInventoryItemMutation();

  const scanItem = async () => {
    const code = codeInput.trim();
    if (!code) {
      throw new Error(copy.notFoundMessage);
    }

    const result = await scanMutation.mutateAsync({
      code,
      branchId: currentBranchId,
    });

    router.push(`/${locale}/inventory/${result.itemId}`);
    return result;
  };

  return {
    copy,
    codeInput,
    setCodeInput,
    scanError,
    setScanError,
    scanMutation,
    scanItem,
  };
}
