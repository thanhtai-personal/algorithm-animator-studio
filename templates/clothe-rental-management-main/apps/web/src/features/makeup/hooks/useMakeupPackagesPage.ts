"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { AppLocale } from "@/constants/locale";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import {
  useCreateMakeupPackageMutation,
  useMakeupPackagesQuery,
  useUpdateMakeupPackageMutation,
} from "@/features/makeup/queries/useMakeupQueries";
import { makeupStore } from "@/features/makeup/stores/makeupStore";

const COPY = {
  vi: {
    title: "Gói makeup",
    subtitle: "Thiết lập gói dịch vụ makeup theo chi nhánh.",
    loading: "Đang tải danh sách gói makeup...",
    loadError: "Tải danh sách gói makeup thất bại.",
    retryAction: "Thử lại",
    createAction: "Tạo gói",
    saveAction: "Lưu",
    successCreate: "Đã tạo gói makeup.",
    successUpdate: "Đã cập nhật gói makeup.",
  },
  en: {
    title: "Makeup packages",
    subtitle: "Configure makeup service packages by branch.",
    loading: "Loading makeup packages...",
    loadError: "Failed to load makeup packages.",
    retryAction: "Retry",
    createAction: "Create package",
    saveAction: "Save",
    successCreate: "Makeup package created.",
    successUpdate: "Makeup package updated.",
  },
} as const;

export function useMakeupPackagesPage(locale: AppLocale) {
  const copy = COPY[locale];
  const { currentBranchId, role } = useAuthAccess();
  const canEdit = role === "owner_admin" || role === "manager" || role === "makeup_artist";

  const query = useMakeupPackagesQuery({
    branchId: currentBranchId,
  });

  const createMutation = useCreateMakeupPackageMutation();
  const updateMutation = useUpdateMakeupPackageMutation();

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [priceAmount, setPriceAmount] = useState("0");
  const [costAmount, setCostAmount] = useState("0");

  const onCreate = async () => {
    try {
      await createMutation.mutateAsync({
        branchId: currentBranchId,
        code,
        name,
        description: description || null,
        durationMinutes: Number(durationMinutes),
        priceAmount: Number(priceAmount),
        costAmount: Number(costAmount),
        isActive: true,
      });
      setCode("");
      setName("");
      setDescription("");
      toast.success(copy.successCreate);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.loadError);
    }
  };

  const onToggleActive = async (packageId: string, isActive: boolean) => {
    try {
      await updateMutation.mutateAsync({
        packageId,
        payload: { isActive },
      });
      toast.success(copy.successUpdate);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.loadError);
    }
  };

  return {
    copy,
    canEdit,
    query,
    createMutation,
    updateMutation,
    packages: makeupStore.packages?.items ?? [],
    code,
    setCode,
    name,
    setName,
    description,
    setDescription,
    durationMinutes,
    setDurationMinutes,
    priceAmount,
    setPriceAmount,
    costAmount,
    setCostAmount,
    onCreate,
    onToggleActive,
  };
}
