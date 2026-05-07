"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import type { AppLocale } from "@/constants/locale";
import { ORDER_STATUS_LABEL_KEYS } from "@/constants/domainPrimitives";
import { useAppModal } from "@/components/feedback/AppModalProvider";
import { useLocaleSwitch } from "@/features/app-shell/hooks/useLocaleSwitch";
import { useHomeSessionPanel } from "@/features/auth/hooks/home/useHomeSessionPanel";
import {
  useCloseSalesShiftMutation,
  useCurrentSalesShiftDetailQuery,
  useCurrentSalesShiftQuery,
  useOpenSalesShiftMutation,
  useSalesPosPasskeyPolicyQuery,
  useVerifySalesPosPasskeyMutation,
} from "@/features/sales/queries/useSalesQueries";
import { salesStore } from "@/features/sales/stores/salesStore";
import {
  clearPosPasskeyUnlockSession,
  isPosPasskeyUnlockedForContext,
  persistPosPasskeyUnlockSession,
} from "@/features/sales/utils/posPasskeyUnlockSession";
import { authStore } from "@/store/authStore";
import type { OrderStatus } from "@/types/domainPrimitives";
import type { SalesShiftStatus } from "@/types/salesDesk";
import { buildDomainLabels } from "@/utils/domainLabels";
import { formatMoney } from "@/utils/format/money";
import { localizePathname, stripLocaleFromPathname } from "@/utils/locale";
import { SALES_LAYOUT_COPY, SHIFT_STATUS_LABEL_KEYS, CLOSE_SHIFT_ORDERS_PAGE_SIZE } from "./constants";
import { formatShiftDateTime, isDashboardRole, mapPosPasskeyErrorMessage, mapShiftActionErrorMessage, parseCashInput, roundMoney } from "./utils";
import type { SalesLayoutCopy } from "./types";

export function useSalesLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const pathWithoutLocale = stripLocaleFromPathname(pathname);
  const { currentLocale, switchLocale } = useLocaleSwitch();
  const { confirm } = useAppModal();
  const { profileName, role, branchAccess, currentBranchId } = useHomeSessionPanel();

  const [openShiftModalOpen, setOpenShiftModalOpen] = useState(false);
  const [closeShiftModalOpen, setCloseShiftModalOpen] = useState(false);
  const [openShiftCashInput, setOpenShiftCashInput] = useState("0");
  const [openShiftNoteInput, setOpenShiftNoteInput] = useState("");
  const [closeShiftCashInput, setCloseShiftCashInput] = useState("");
  const [closeShiftNoteInput, setCloseShiftNoteInput] = useState("");
  const [closeShiftOrdersPage, setCloseShiftOrdersPage] = useState(1);
  const [posPasskeyInput, setPosPasskeyInput] = useState("");
  const [pendingProtectedHref, setPendingProtectedHref] = useState<string | null>(null);
  const [posPasskeyError, setPosPasskeyError] = useState<string | null>(null);
  const [hasPosPasskeyUnlockSession, setHasPosPasskeyUnlockSession] = useState(false);

  const copy = SALES_LAYOUT_COPY[currentLocale];
  const orderStatusLabels = useMemo(
    () => buildDomainLabels(currentLocale, ORDER_STATUS_LABEL_KEYS),
    [currentLocale]
  );
  const shiftStatusLabels = useMemo(
    () => buildDomainLabels(currentLocale, SHIFT_STATUS_LABEL_KEYS),
    [currentLocale]
  );
  const openShiftMutation = useOpenSalesShiftMutation();
  const closeShiftMutation = useCloseSalesShiftMutation();
  const posPasskeyPolicyQuery = useSalesPosPasskeyPolicyQuery();
  const verifyPosPasskeyMutation = useVerifySalesPosPasskeyMutation();
  const currentShiftQuery = useCurrentSalesShiftQuery(currentBranchId);
  const currentShiftDetailQuery = useCurrentSalesShiftDetailQuery(
    currentBranchId,
    closeShiftModalOpen && Boolean(currentBranchId) && Boolean(salesStore.currentShift)
  );
  const posPasskeyPolicy = posPasskeyPolicyQuery.data ?? {
    enabled: false,
    configured: false,
    version: 0,
    updatedAt: null,
  };
  const posPasskeyLockEnabled = posPasskeyPolicyQuery.isError
    ? true
    : posPasskeyPolicy.enabled;
  const posPasskeyLockVersion = posPasskeyPolicy.version;
  const sessionUserId = authStore.userId ?? authStore.anonId ?? null;
  const currentPath = pathWithoutLocale;
  const localizedCurrentPath = localizePathname(currentPath, currentLocale);
  const isPosRoute =
    currentPath === "/sales/pos" ||
    currentPath.startsWith("/sales/pos/") ||
    currentPath === "/sales/desk" ||
    currentPath.startsWith("/sales/desk/");
  const isReturnsRoute =
    currentPath === "/sales/returns" || currentPath.startsWith("/sales/returns/");
  const isProtectedRoute = !isPosRoute && !isReturnsRoute;

  useEffect(() => {
    if (posPasskeyPolicyQuery.isError) return;

    if (!posPasskeyLockEnabled) {
      clearPosPasskeyUnlockSession();
      setHasPosPasskeyUnlockSession(true);
      return;
    }

    setHasPosPasskeyUnlockSession(
      isPosPasskeyUnlockedForContext({
        userId: sessionUserId,
        branchId: currentBranchId,
        version: posPasskeyLockVersion,
      })
    );
  }, [
    currentBranchId,
    posPasskeyLockEnabled,
    posPasskeyLockVersion,
    posPasskeyPolicyQuery.isError,
    sessionUserId,
  ]);

  useEffect(() => {
    if (!isProtectedRoute || hasPosPasskeyUnlockSession) return;
    setPendingProtectedHref(localizedCurrentPath);
  }, [hasPosPasskeyUnlockSession, isProtectedRoute, localizedCurrentPath]);

  const tabItems = useMemo(() => {
    const base = [
      {
        key: "pos",
        label: "POS",
        href: localizePathname("/sales/pos", currentLocale),
        isActive:
          currentPath === "/sales/pos" ||
          currentPath.startsWith("/sales/pos/") ||
          currentPath === "/sales/desk" ||
          currentPath.startsWith("/sales/desk/"),
        requiresPasskey: false,
      },
      {
        key: "returns",
        label: currentLocale === "vi" ? "Trả hàng" : "Returns",
        href: localizePathname("/sales/returns", currentLocale),
        isActive:
          currentPath === "/sales/returns" || currentPath.startsWith("/sales/returns/"),
        requiresPasskey: false,
      },
      {
        key: "stock",
        label: currentLocale === "vi" ? "Tồn kho" : "Stock",
        href: localizePathname("/sales/stock", currentLocale),
        isActive:
          currentPath === "/sales/stock" || currentPath.startsWith("/sales/stock/"),
        requiresPasskey: true,
      },
      {
        key: "invoices",
        label: currentLocale === "vi" ? "Hóa đơn" : "Invoices",
        href: localizePathname("/sales/invoices", currentLocale),
        isActive:
          currentPath === "/sales/invoices" ||
          currentPath.startsWith("/sales/invoices/"),
        requiresPasskey: true,
      },
      {
        key: "productEntry",
        label: currentLocale === "vi" ? "Nhập SP" : "Product Entry",
        href: localizePathname("/sales/product-entry", currentLocale),
        isActive:
          currentPath === "/sales/product-entry" ||
          currentPath.startsWith("/sales/product-entry/"),
        requiresPasskey: true,
      },
      {
        key: "surchargeExpense",
        label: currentLocale === "vi" ? "Phụ thu/chi" : "Surcharge/Expense",
        href: localizePathname("/sales/surcharge-expense", currentLocale),
        isActive:
          currentPath === "/sales/surcharge-expense" ||
          currentPath.startsWith("/sales/surcharge-expense/"),
        requiresPasskey: true,
      },
    ] as const;

    return base;
  }, [currentLocale, currentPath]);

  const canBackDashboard = isDashboardRole(role);
  const backHref = localizePathname(canBackDashboard ? "/dashboard" : "/showroom", currentLocale);
  const backLabel = canBackDashboard ? copy.backToDashboard : copy.backToShowroom;
  const userLabel = profileName?.trim() || (currentLocale === "vi" ? "Nhân viên" : "Staff");
  const userInitial = userLabel.charAt(0).toUpperCase() || "S";

  const branchOptions = useMemo(() => {
    if (branchAccess.length === 0) return [];

    return branchAccess.map((entry) => ({
      value: entry.branchId,
      label: entry.isDefault
        ? `${entry.branchName?.trim() || entry.branchId} (${currentLocale === "vi" ? "Mặc định" : "Default"})`
        : entry.branchName?.trim() || entry.branchId,
    }));
  }, [branchAccess, currentLocale]);

  const setCurrentBranch = useCallback((branchId: string) => {
    setOpenShiftModalOpen(false);
    setCloseShiftModalOpen(false);
    setCloseShiftOrdersPage(1);
    setPendingProtectedHref(null);
    setPosPasskeyError(null);
    authStore.currentBranchId = branchId || null;
  }, []);

  const requestProtectedNavigation = useCallback(
    (href: string) => {
      const localizedHref = localizePathname(stripLocaleFromPathname(href), currentLocale);
      if (!posPasskeyLockEnabled || hasPosPasskeyUnlockSession) {
        router.push(localizedHref);
        return;
      }

      setPendingProtectedHref(localizedHref);
      setPosPasskeyInput("");
      setPosPasskeyError(null);
    },
    [currentLocale, hasPosPasskeyUnlockSession, posPasskeyLockEnabled, router]
  );

  const retryPosPasskeyPolicy = useCallback(() => {
    void posPasskeyPolicyQuery.refetch();
  }, [posPasskeyPolicyQuery]);

  const submitPosPasskey = useCallback(async () => {
    if (!posPasskeyLockEnabled) {
      setHasPosPasskeyUnlockSession(true);
      return;
    }

    const passkey = posPasskeyInput.trim();
    if (!passkey) {
      setPosPasskeyError(copy.posPasskeyRequired);
      return;
    }

    try {
      const result = await verifyPosPasskeyMutation.mutateAsync({ passkey });
      persistPosPasskeyUnlockSession({
        userId: sessionUserId ?? "",
        branchId: currentBranchId,
        version: result.policy.version,
      });
      setHasPosPasskeyUnlockSession(true);
      setPosPasskeyError(null);

      if (pendingProtectedHref) {
        const normalizedPendingHref = localizePathname(
          stripLocaleFromPathname(pendingProtectedHref),
          currentLocale
        );
        if (normalizedPendingHref !== localizedCurrentPath) {
          router.push(normalizedPendingHref);
        }
        setPendingProtectedHref(null);
      }
    } catch (error) {
      setPosPasskeyError(mapPosPasskeyErrorMessage(copy, error));
    }
  }, [
    copy,
    currentLocale,
    currentBranchId,
    localizedCurrentPath,
    pendingProtectedHref,
    posPasskeyInput,
    posPasskeyLockEnabled,
    router,
    sessionUserId,
    verifyPosPasskeyMutation,
  ]);

  const handleOpenShift = useCallback(() => {
    if (!currentBranchId) {
      toast.error(copy.shiftBranchRequired);
      return;
    }

    if (salesStore.currentShift) {
      toast.error(copy.shiftAlreadyOpen);
      return;
    }

    setOpenShiftCashInput("0");
    setOpenShiftNoteInput("");
    setOpenShiftModalOpen(true);
  }, [copy.shiftAlreadyOpen, copy.shiftBranchRequired, currentBranchId]);

  const handleCloseShift = useCallback(() => {
    const currentShift = salesStore.currentShift;
    if (!currentBranchId) {
      toast.error(copy.shiftBranchRequired);
      return;
    }

    if (!currentShift) {
      toast.error(copy.shiftNotFound);
      return;
    }

    const expectedCash =
      currentShift.reconciliation?.expectedClosingCash ?? currentShift.openingCash;

    setCloseShiftCashInput(String(expectedCash));
    setCloseShiftNoteInput("");
    setCloseShiftOrdersPage(1);
    setCloseShiftModalOpen(true);
  }, [copy.shiftBranchRequired, copy.shiftNotFound, currentBranchId]);

  const closeShiftDetail = currentShiftDetailQuery.data?.shift ?? null;
  const closeShiftRef = closeShiftDetail ?? salesStore.currentShift;
  const closeShiftExpectedCash =
    closeShiftRef?.reconciliation?.expectedClosingCash ?? closeShiftRef?.openingCash ?? 0;
  const closeShiftCashNetMovement = closeShiftRef?.reconciliation?.cashNetMovement ?? 0;

  const parsedCloseShiftCash = parseCashInput(closeShiftCashInput);
  const closeShiftVariance =
    parsedCloseShiftCash === null
      ? null
      : roundMoney(parsedCloseShiftCash - closeShiftExpectedCash);

  const closeShiftExpectedCashLabel =
    formatMoney(closeShiftExpectedCash, {
      locale: currentLocale,
      currency: "VND",
    }) || "0";

  const closeShiftVarianceLabel =
    closeShiftVariance === null
      ? "-"
      : formatMoney(closeShiftVariance, {
          locale: currentLocale,
          currency: "VND",
        }) || String(closeShiftVariance);

  const closeShiftOrders = closeShiftDetail?.orders ?? [];
  const closeShiftOrdersTotalPages = Math.max(
    1,
    Math.ceil(closeShiftOrders.length / CLOSE_SHIFT_ORDERS_PAGE_SIZE)
  );
  const boundedCloseShiftOrdersPage = Math.max(
    1,
    Math.min(closeShiftOrdersPage, closeShiftOrdersTotalPages)
  );
  const closeShiftOrdersPageStart =
    (boundedCloseShiftOrdersPage - 1) * CLOSE_SHIFT_ORDERS_PAGE_SIZE;
  const closeShiftOrdersPageItems = closeShiftOrders.slice(
    closeShiftOrdersPageStart,
    closeShiftOrdersPageStart + CLOSE_SHIFT_ORDERS_PAGE_SIZE
  );

  const submitOpenShift = useCallback(async () => {
    if (!currentBranchId) {
      toast.error(copy.shiftBranchRequired);
      return;
    }

    const openingCash = parseCashInput(openShiftCashInput);
    if (openingCash === null) {
      toast.error(copy.shiftInvalidCash);
      return;
    }

    try {
      await openShiftMutation.mutateAsync({
        branchId: currentBranchId,
        openingCash,
        note: openShiftNoteInput.trim() || null,
      });

      setOpenShiftModalOpen(false);
      setOpenShiftCashInput("0");
      setOpenShiftNoteInput("");
      toast.success(copy.shiftOpenSuccess);
    } catch (error) {
      toast.error(mapShiftActionErrorMessage(copy, error));
    }
  }, [
    copy,
    currentBranchId,
    openShiftCashInput,
    openShiftMutation,
    openShiftNoteInput,
  ]);

  const submitCloseShift = useCallback(async () => {
    const currentShift = salesStore.currentShift;
    if (!currentBranchId) {
      toast.error(copy.shiftBranchRequired);
      return;
    }

    if (!currentShift) {
      toast.error(copy.shiftNotFound);
      return;
    }

    const closingCash = parseCashInput(closeShiftCashInput);
    if (closingCash === null) {
      toast.error(copy.shiftInvalidCash);
      return;
    }

    const expectedCash =
      closeShiftRef?.reconciliation?.expectedClosingCash ??
      closeShiftRef?.openingCash ??
      currentShift.openingCash;
    const variance = roundMoney(closingCash - expectedCash);
    const hasVariance = Math.abs(variance) > 0;
    const note = closeShiftNoteInput.trim() || null;

    if (hasVariance && !note) {
      toast.error(copy.shiftVarianceNoteRequired);
      return;
    }

    if (hasVariance) {
      const confirmed = await confirm({
        title: copy.shiftVarianceConfirmTitle,
        description: `${copy.shiftExpectedCashLabel}: ${closeShiftExpectedCashLabel}\n${copy.shiftVarianceLabel}: ${
          formatMoney(variance, { locale: currentLocale, currency: "VND" }) || String(variance)
        }`,
        tone: "danger",
        confirmText: copy.shiftVarianceConfirmAction,
      });

      if (!confirmed) return;
    }

    try {
      await closeShiftMutation.mutateAsync({
        branchId: currentBranchId,
        shiftId: closeShiftRef?.id ?? currentShift.id,
        closingCash,
        note,
      });

      setCloseShiftModalOpen(false);
      setCloseShiftCashInput("");
      setCloseShiftNoteInput("");
      setCloseShiftOrdersPage(1);
      toast.success(copy.shiftCloseSuccess);
    } catch (error) {
      toast.error(mapShiftActionErrorMessage(copy, error));
    }
  }, [
    closeShiftCashInput,
    closeShiftExpectedCashLabel,
    closeShiftMutation,
    closeShiftNoteInput,
    closeShiftRef,
    confirm,
    copy,
    currentBranchId,
    currentLocale,
  ]);

  const closeOpenShiftModal = useCallback(() => {
    setOpenShiftModalOpen(false);
  }, []);

  const closeCloseShiftModal = useCallback(() => {
    setCloseShiftModalOpen(false);
    setCloseShiftOrdersPage(1);
  }, []);

  const currentShiftExpectedCashLabel = salesStore.currentShift
    ?
        formatMoney(
          salesStore.currentShift.reconciliation?.expectedClosingCash ??
            salesStore.currentShift.openingCash,
          {
            locale: currentLocale,
            currency: "VND",
          }
        ) || "-"
    : "-";

  const currentShiftCashNetLabel = salesStore.currentShift
    ?
        formatMoney(salesStore.currentShift.reconciliation?.cashNetMovement ?? 0, {
          locale: currentLocale,
          currency: "VND",
        }) || "-"
    : "-";
  const requiresPosPasskeyPrompt =
    posPasskeyLockEnabled &&
    !hasPosPasskeyUnlockSession &&
    (isProtectedRoute || Boolean(pendingProtectedHref));
  const shouldShowPosPasskeyState = isProtectedRoute || Boolean(pendingProtectedHref);

  return {
    currentLocale,
    switchLocale,
    copy,
    orderStatusLabels,
    shiftStatusLabels,
    resolveOrderStatusLabel: (status: OrderStatus) => orderStatusLabels[status],
    resolveShiftStatusLabel: (status: SalesShiftStatus) => shiftStatusLabels[status],
    tabItems,
    isPosPasskeyLockEnabled: posPasskeyLockEnabled,
    hasPosPasskeyUnlockSession,
    requestProtectedNavigation,
    backHref,
    backLabel,
    userLabel,
    userInitial,
    branchOptions,
    currentBranchId,
    setCurrentBranch,
    currentShift: salesStore.currentShift,
    currentShiftLabel: formatShiftDateTime(salesStore.currentShift?.openedAt ?? null, currentLocale),
    currentShiftExpectedCashLabel,
    currentShiftCashNetLabel,
    requiresPosPasskeyPrompt,
    isPosPasskeyPolicyLoading:
      shouldShowPosPasskeyState &&
      (posPasskeyPolicyQuery.isLoading || posPasskeyPolicyQuery.isFetching),
    isPosPasskeyPolicyError: shouldShowPosPasskeyState && posPasskeyPolicyQuery.isError,
    posPasskeyInput,
    setPosPasskeyInput,
    posPasskeyError,
    setPosPasskeyError,
    submitPosPasskey,
    retryPosPasskeyPolicy,
    isPosPasskeySubmitting: verifyPosPasskeyMutation.isPending,
    isShiftLoading: currentShiftQuery.isLoading,
    isShiftMutating: openShiftMutation.isPending || closeShiftMutation.isPending,
    handleOpenShift,
    handleCloseShift,
    openShiftModalOpen,
    closeShiftModalOpen,
    openShiftCashInput,
    openShiftNoteInput,
    closeShiftCashInput,
    closeShiftNoteInput,
    setOpenShiftCashInput,
    setOpenShiftNoteInput,
    setCloseShiftCashInput,
    setCloseShiftNoteInput,
    closeOpenShiftModal,
    closeCloseShiftModal,
    submitOpenShift,
    submitCloseShift,
    closeShiftExpectedCash,
    closeShiftCashNetMovement,
    closeShiftExpectedCashLabel,
    closeShiftVariance,
    closeShiftVarianceLabel,
    closeShiftSummary: closeShiftDetail?.summary ?? null,
    closeShiftOrders: closeShiftOrdersPageItems,
    closeShiftOrdersPage: boundedCloseShiftOrdersPage,
    closeShiftOrdersTotalPages,
    setCloseShiftOrdersPage: (nextPage: number) => {
      setCloseShiftOrdersPage(
        Math.max(1, Math.min(closeShiftOrdersTotalPages, Math.trunc(nextPage)))
      );
    },
    isCloseShiftDetailLoading:
      closeShiftModalOpen && (currentShiftDetailQuery.isLoading || currentShiftDetailQuery.isFetching),
    isCloseShiftDetailError: closeShiftModalOpen && currentShiftDetailQuery.isError,
    formatShiftDateTime: (value: string | null) => formatShiftDateTime(value, currentLocale),
    formatMoneyLabel: (value: number) =>
      formatMoney(value, { locale: currentLocale, currency: "VND" }) || "0",
  };
}

type UseSalesLayoutReturn = ReturnType<typeof useSalesLayout>;
export type { UseSalesLayoutReturn };
