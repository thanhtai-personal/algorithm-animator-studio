"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { AppLocale } from "@/constants/locale";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import {
  useCreateMakeupOrderMutation,
  useCreateMakeupPurchaseInvoiceMutation,
  useMakeupArtistsQuery,
  useMakeupInventoryQuery,
  useMakeupOrdersQuery,
  useMakeupPurchaseInvoicesQuery,
  useUpdateMakeupOrderMutation,
  useUpdateMakeupPurchaseInvoiceMutation,
} from "@/features/makeup/queries/useMakeupQueries";
import { makeupStore } from "@/features/makeup/stores/makeupStore";
import { formatMoney } from "@/utils/format/money";

const COPY = {
  vi: {
    title: "Quản lý đơn makeup",
    subtitle: "Quản lý đơn makeup service và hóa đơn nhập hàng makeup.",
    loading: "Đang tải dữ liệu đơn makeup...",
    loadError: "Tải dữ liệu đơn makeup thất bại.",
    retryAction: "Thử lại",
    createOrderSuccess: "Đã tạo đơn makeup.",
    updateOrderSuccess: "Đã cập nhật đơn makeup.",
    createInvoiceSuccess: "Đã tạo hóa đơn nhập hàng makeup.",
    updateInvoiceSuccess: "Đã cập nhật hóa đơn nhập hàng makeup.",
    invoiceItemInvalid: "Dòng hàng hóa đơn chưa hợp lệ.",
  },
  en: {
    title: "Makeup orders",
    subtitle: "Manage makeup service orders and makeup purchase invoices.",
    loading: "Loading makeup orders...",
    loadError: "Failed to load makeup orders.",
    retryAction: "Retry",
    createOrderSuccess: "Makeup order created.",
    updateOrderSuccess: "Makeup order updated.",
    createInvoiceSuccess: "Purchase invoice created.",
    updateInvoiceSuccess: "Purchase invoice updated.",
    invoiceItemInvalid: "Invalid invoice item input.",
  },
} as const;

type OrdersTabKey = "makeup-orders" | "purchase-invoices";

function toIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toIsoDateTime(value: string): string | null {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

interface InvoiceDraftItem {
  inventoryItemId: string | null;
  itemName: string;
  quantity: number;
  unitCostAmount: number;
  note: string | null;
}

export function useMakeupOrdersPage(locale: AppLocale) {
  const copy = COPY[locale];
  const { currentBranchId, role } = useAuthAccess();
  const canManage = role === "owner_admin" || role === "manager" || role === "staff";
  const todayIso = useMemo(() => toIsoDate(new Date()), []);

  const [activeTab, setActiveTab] = useState<OrdersTabKey>("makeup-orders");

  const [orderStartDate, setOrderStartDate] = useState(todayIso.slice(0, 8) + "01");
  const [orderEndDate, setOrderEndDate] = useState(todayIso);
  const [orderStatus, setOrderStatus] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderDate, setOrderDate] = useState(todayIso);
  const [orderStartTime, setOrderStartTime] = useState("08:00");
  const [orderEndTime, setOrderEndTime] = useState("09:20");
  const [orderArtistProfileId, setOrderArtistProfileId] = useState("");
  const [orderCustomerName, setOrderCustomerName] = useState("");
  const [orderCustomerPhone, setOrderCustomerPhone] = useState("");
  const [orderNote, setOrderNote] = useState("");

  const [invoiceStartDate, setInvoiceStartDate] = useState(todayIso.slice(0, 8) + "01");
  const [invoiceEndDate, setInvoiceEndDate] = useState(todayIso);
  const [invoiceStatus, setInvoiceStatus] = useState("");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(todayIso);
  const [invoiceCreateStatus, setInvoiceCreateStatus] = useState("DRAFT");
  const [invoiceSupplierName, setInvoiceSupplierName] = useState("");
  const [invoiceSupplierPhone, setInvoiceSupplierPhone] = useState("");
  const [invoiceNote, setInvoiceNote] = useState("");
  const [invoiceDraftItems, setInvoiceDraftItems] = useState<InvoiceDraftItem[]>([]);
  const [invoiceItemInventoryId, setInvoiceItemInventoryId] = useState("");
  const [invoiceItemName, setInvoiceItemName] = useState("");
  const [invoiceItemQuantity, setInvoiceItemQuantity] = useState("1");
  const [invoiceItemUnitCost, setInvoiceItemUnitCost] = useState("0");
  const [invoiceItemNote, setInvoiceItemNote] = useState("");

  const artistsQuery = useMakeupArtistsQuery(currentBranchId, canManage);
  const inventoryQuery = useMakeupInventoryQuery(
    {
      branchId: currentBranchId,
      isActive: true,
    },
    canManage
  );

  const ordersQuery = useMakeupOrdersQuery(
    {
      branchId: currentBranchId,
      startDate: orderStartDate,
      endDate: orderEndDate,
      status: (orderStatus || null) as "BOOKED" | "COMPLETED" | "CANCELLED" | null,
      search: orderSearch.trim() || null,
    },
    canManage
  );
  const purchaseInvoicesQuery = useMakeupPurchaseInvoicesQuery(
    {
      branchId: currentBranchId,
      startDate: invoiceStartDate,
      endDate: invoiceEndDate,
      status: (invoiceStatus || null) as "DRAFT" | "CONFIRMED" | "PAID" | "CANCELLED" | null,
      search: invoiceSearch.trim() || null,
    },
    canManage
  );

  const createOrderMutation = useCreateMakeupOrderMutation();
  const updateOrderMutation = useUpdateMakeupOrderMutation();
  const createInvoiceMutation = useCreateMakeupPurchaseInvoiceMutation();
  const updateInvoiceMutation = useUpdateMakeupPurchaseInvoiceMutation();

  const orders = makeupStore.orders?.items ?? [];
  const purchaseInvoices = makeupStore.purchaseInvoices?.items ?? [];
  const inventoryItems = makeupStore.inventory?.items ?? [];

  const onCreateOrder = async () => {
    if (!currentBranchId) return;
    const startAt = toIsoDateTime(`${orderDate}T${orderStartTime}`);
    const endAt = toIsoDateTime(`${orderDate}T${orderEndTime}`);
    if (!startAt || !endAt || endAt <= startAt) {
      toast.error(copy.loadError);
      return;
    }

    try {
      await createOrderMutation.mutateAsync({
        branchId: currentBranchId,
        eventDate: orderDate,
        startAt,
        endAt,
        artistProfileId: orderArtistProfileId || null,
        customerName: orderCustomerName.trim() || null,
        customerPhone: orderCustomerPhone.trim() || null,
        note: orderNote.trim() || null,
      });
      setOrderCustomerName("");
      setOrderCustomerPhone("");
      setOrderNote("");
      toast.success(copy.createOrderSuccess);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.loadError);
    }
  };

  const onUpdateOrderStatus = async (
    orderId: string,
    status: "BOOKED" | "COMPLETED" | "CANCELLED"
  ) => {
    try {
      await updateOrderMutation.mutateAsync({
        orderId,
        payload: { status },
      });
      toast.success(copy.updateOrderSuccess);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.loadError);
    }
  };

  const onAddInvoiceDraftItem = () => {
    const itemName = invoiceItemName.trim();
    const quantity = Number(invoiceItemQuantity);
    const unitCostAmount = Number(invoiceItemUnitCost);
    if (
      !itemName ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(unitCostAmount) ||
      unitCostAmount < 0
    ) {
      toast.error(copy.invoiceItemInvalid);
      return;
    }
    setInvoiceDraftItems((previous) => [
      ...previous,
      {
        inventoryItemId: invoiceItemInventoryId || null,
        itemName,
        quantity,
        unitCostAmount,
        note: invoiceItemNote.trim() || null,
      },
    ]);
    setInvoiceItemInventoryId("");
    setInvoiceItemName("");
    setInvoiceItemQuantity("1");
    setInvoiceItemUnitCost("0");
    setInvoiceItemNote("");
  };

  const onRemoveInvoiceDraftItem = (index: number) => {
    setInvoiceDraftItems((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
  };

  const onCreatePurchaseInvoice = async () => {
    if (!currentBranchId) return;
    try {
      await createInvoiceMutation.mutateAsync({
        branchId: currentBranchId,
        invoiceDate,
        status: invoiceCreateStatus as "DRAFT" | "CONFIRMED" | "PAID" | "CANCELLED",
        supplierName: invoiceSupplierName.trim() || null,
        supplierPhone: invoiceSupplierPhone.trim() || null,
        note: invoiceNote.trim() || null,
        items: invoiceDraftItems,
      });
      setInvoiceSupplierName("");
      setInvoiceSupplierPhone("");
      setInvoiceNote("");
      setInvoiceDraftItems([]);
      toast.success(copy.createInvoiceSuccess);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.loadError);
    }
  };

  const onUpdateInvoiceStatus = async (
    invoiceId: string,
    status: "DRAFT" | "CONFIRMED" | "PAID" | "CANCELLED"
  ) => {
    try {
      await updateInvoiceMutation.mutateAsync({
        invoiceId,
        payload: { status },
      });
      toast.success(copy.updateInvoiceSuccess);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.loadError);
    }
  };

  const onToggleInvoiceActive = async (invoiceId: string, isActive: boolean) => {
    try {
      await updateInvoiceMutation.mutateAsync({
        invoiceId,
        payload: { isActive: !isActive },
      });
      toast.success(copy.updateInvoiceSuccess);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.loadError);
    }
  };

  const formatCurrency = (value: number) =>
    formatMoney(value, { locale, currency: "VND", maximumFractionDigits: 0 });
  const formatOrderTime = (startAt: string, endAt: string) => {
    const formatter = new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    return `${formatter.format(new Date(startAt))} - ${formatter.format(new Date(endAt))}`;
  };

  return {
    copy,
    canManage,
    activeTab,
    setActiveTab,
    artistsQuery,
    inventoryQuery,
    ordersQuery,
    purchaseInvoicesQuery,
    createOrderMutation,
    updateOrderMutation,
    createInvoiceMutation,
    updateInvoiceMutation,
    orders,
    purchaseInvoices,
    inventoryItems,
    orderStartDate,
    setOrderStartDate,
    orderEndDate,
    setOrderEndDate,
    orderStatus,
    setOrderStatus,
    orderSearch,
    setOrderSearch,
    orderDate,
    setOrderDate,
    orderStartTime,
    setOrderStartTime,
    orderEndTime,
    setOrderEndTime,
    orderArtistProfileId,
    setOrderArtistProfileId,
    orderCustomerName,
    setOrderCustomerName,
    orderCustomerPhone,
    setOrderCustomerPhone,
    orderNote,
    setOrderNote,
    invoiceStartDate,
    setInvoiceStartDate,
    invoiceEndDate,
    setInvoiceEndDate,
    invoiceStatus,
    setInvoiceStatus,
    invoiceSearch,
    setInvoiceSearch,
    invoiceDate,
    setInvoiceDate,
    invoiceCreateStatus,
    setInvoiceCreateStatus,
    invoiceSupplierName,
    setInvoiceSupplierName,
    invoiceSupplierPhone,
    setInvoiceSupplierPhone,
    invoiceNote,
    setInvoiceNote,
    invoiceDraftItems,
    invoiceItemInventoryId,
    setInvoiceItemInventoryId,
    invoiceItemName,
    setInvoiceItemName,
    invoiceItemQuantity,
    setInvoiceItemQuantity,
    invoiceItemUnitCost,
    setInvoiceItemUnitCost,
    invoiceItemNote,
    setInvoiceItemNote,
    onCreateOrder,
    onUpdateOrderStatus,
    onAddInvoiceDraftItem,
    onRemoveInvoiceDraftItem,
    onCreatePurchaseInvoice,
    onUpdateInvoiceStatus,
    onToggleInvoiceActive,
    formatCurrency,
    formatOrderTime,
  };
}

export type MakeupOrdersPageModel = ReturnType<typeof useMakeupOrdersPage>;
