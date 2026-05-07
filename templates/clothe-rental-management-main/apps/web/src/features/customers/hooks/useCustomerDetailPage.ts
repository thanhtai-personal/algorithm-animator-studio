"use client";

import { useMemo, useState } from "react";
import { ORDER_STATUS_LABEL_KEYS } from "@/constants/domainPrimitives";
import type { AppLocale } from "@/constants/locale";
import { useCustomerDetailQuery, useUpdateCustomerMutation } from "@/features/customers/queries/useCustomersQueries";
import { customersStore } from "@/features/customers/stores/customersStore";
import { validatePhoneNumber } from "@/utils/validation/phone";
import type { OrderStatus } from "@/types/domainPrimitives";
import { buildDomainLabels } from "@/utils/domainLabels";

interface CustomerDetailCopy {
  backAction: string;
  loading: string;
  notFound: string;
  contactInfoTitle: string;
  tagsTitle: string;
  notesTitle: string;
  ordersHistoryTitle: string;
  incidentsSummaryTitle: string;
  saveAction: string;
  saveSuccess: string;
  saveFailed: string;
  fullNameLabel: string;
  phoneLabel: string;
  socialLinkLabel: string;
  addressLabel: string;
  noteLabel: string;
  isActiveLabel: string;
  orderStatusFilter: string;
  allOrderStatuses: string;
  emptyOrders: string;
  nameRequired: string;
  phoneRequired: string;
  phoneInvalid: string;
  stats: {
    totalOrders: string;
    totalSpent: string;
    lastOrderDate: string;
    totalIncidents: string;
    openIncidents: string;
    late: string;
    damage: string;
    lost: string;
    cleaning: string;
    incidentAmount: string;
  };
  orderTableHeaders: {
    code: string;
    status: string;
    period: string;
    total: string;
    deposit: string;
    createdAt: string;
  };
}

interface CustomerEditDraft {
  customerId: string;
  fullName: string;
  phone: string;
  socialLink: string;
  address: string;
  note: string;
  isActive: boolean;
  tagIds: string[];
}

const CUSTOMER_DETAIL_COPY: Record<AppLocale, CustomerDetailCopy> = {
  vi: {
    backAction: "Quay lại danh sách khách hàng",
    loading: "Đang tải chi tiết khách hàng...",
    notFound: "Không tìm thấy khách hàng hoặc bạn không có quyền truy cập.",
    contactInfoTitle: "Thông tin liên hệ",
    tagsTitle: "Tags",
    notesTitle: "Ghi chú",
    ordersHistoryTitle: "Lịch sử đơn thuê",
    incidentsSummaryTitle: "Tổng quan sự cố",
    saveAction: "Lưu thay đổi",
    saveSuccess: "Đã cập nhật khách hàng.",
    saveFailed: "Cập nhật khách hàng thất bại.",
    fullNameLabel: "Họ tên",
    phoneLabel: "Số điện thoại",
    socialLinkLabel: "Liên kết social",
    addressLabel: "Địa chỉ",
    noteLabel: "Ghi chú",
    isActiveLabel: "Đang hoạt động",
    orderStatusFilter: "Lọc trạng thái đơn",
    allOrderStatuses: "Tất cả trạng thái",
    emptyOrders: "Khách hàng chưa có lịch sử đơn thuê.",
    nameRequired: "Họ tên khách hàng là bắt buộc.",
    phoneRequired: "Số điện thoại là bắt buộc.",
    phoneInvalid: "Số điện thoại chưa đúng định dạng VN (+84 hoặc 0...).",
    stats: {
      totalOrders: "Tổng đơn",
      totalSpent: "Tổng chi",
      lastOrderDate: "Đơn gần nhất",
      totalIncidents: "Tổng sự cố",
      openIncidents: "Đang mở",
      late: "Trễ hạn",
      damage: "Hư hỏng",
      lost: "Mất",
      cleaning: "Vệ sinh",
      incidentAmount: "Tổng phí sự cố",
    },
    orderTableHeaders: {
      code: "Mã đơn",
      status: "Trạng thái",
      period: "Thời gian",
      total: "Tổng tiền",
      deposit: "Tiền cọc",
      createdAt: "Tạo lúc",
    },
  },
  en: {
    backAction: "Back to customers",
    loading: "Loading customer detail...",
    notFound: "Customer not found or access denied.",
    contactInfoTitle: "Contact info",
    tagsTitle: "Tags",
    notesTitle: "Notes",
    ordersHistoryTitle: "Orders history",
    incidentsSummaryTitle: "Incidents summary",
    saveAction: "Save changes",
    saveSuccess: "Customer updated successfully.",
    saveFailed: "Customer update failed.",
    fullNameLabel: "Full name",
    phoneLabel: "Phone",
    socialLinkLabel: "Social link",
    addressLabel: "Address",
    noteLabel: "Note",
    isActiveLabel: "Active",
    orderStatusFilter: "Order status",
    allOrderStatuses: "All statuses",
    emptyOrders: "No rental order history yet.",
    nameRequired: "Customer full name is required.",
    phoneRequired: "Phone number is required.",
    phoneInvalid: "Phone format is invalid for VN-friendly validation.",
    stats: {
      totalOrders: "Total orders",
      totalSpent: "Total spent",
      lastOrderDate: "Last order",
      totalIncidents: "Total incidents",
      openIncidents: "Open",
      late: "Late",
      damage: "Damage",
      lost: "Lost",
      cleaning: "Cleaning",
      incidentAmount: "Incident amount",
    },
    orderTableHeaders: {
      code: "Order code",
      status: "Status",
      period: "Period",
      total: "Total",
      deposit: "Deposit",
      createdAt: "Created at",
    },
  },
};

function buildDraftFromDetail(detail: NonNullable<ReturnType<typeof customersStore.getDetailByCustomerId>>): CustomerEditDraft {
  return {
    customerId: detail.customer.id,
    fullName: detail.customer.fullName,
    phone: detail.customer.phone ?? "",
    socialLink: detail.customer.socialLink ?? "",
    address: detail.customer.address ?? "",
    note: detail.customer.note ?? "",
    isActive: detail.customer.isActive,
    tagIds: detail.customer.tags.map((tag) => tag.id),
  };
}

export function useCustomerDetailPage(locale: AppLocale, customerId: string) {
  const copy = CUSTOMER_DETAIL_COPY[locale];
  const orderStatusLabels = useMemo(
    () => buildDomainLabels(locale, ORDER_STATUS_LABEL_KEYS),
    [locale]
  );

  const detailQuery = useCustomerDetailQuery(customerId);
  const updateMutation = useUpdateCustomerMutation(customerId);
  const detail = customersStore.getDetailByCustomerId(customerId);

  const [draftState, setDraftState] = useState<CustomerEditDraft | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | "">("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const draft = useMemo(() => {
    if (!detail) return null;
    if (draftState && draftState.customerId === detail.customer.id) {
      return draftState;
    }
    return buildDraftFromDetail(detail);
  }, [detail, draftState]);

  const setDraft = (
    updater: (previous: CustomerEditDraft | null) => CustomerEditDraft | null
  ) => {
    setDraftState((previousState) => {
      const baseline =
        detail && previousState?.customerId !== detail.customer.id
          ? buildDraftFromDetail(detail)
          : previousState;

      return updater(baseline);
    });
  };

  const filteredOrders = useMemo(() => {
    if (!detail) return [];
    if (!orderStatusFilter) return detail.ordersHistory;
    return detail.ordersHistory.filter((entry) => entry.status === orderStatusFilter);
  }, [detail, orderStatusFilter]);

  const orderStatusOptions = useMemo(() => {
    if (!detail) return [];

    return Array.from(new Set(detail.ordersHistory.map((entry) => entry.status))).sort(
      (a, b) => a.localeCompare(b)
    );
  }, [detail]);

  const draftPhoneValidation = useMemo(() => {
    if (!draft) {
      return validatePhoneNumber("", { allowEmpty: false });
    }

    return validatePhoneNumber(draft.phone, { allowEmpty: false });
  }, [draft]);

  const toggleTag = (tagId: string) => {
    setDraft((previous) => {
      if (!previous) return previous;

      if (previous.tagIds.includes(tagId)) {
        return {
          ...previous,
          tagIds: previous.tagIds.filter((entry) => entry !== tagId),
        };
      }

      return {
        ...previous,
        tagIds: [...previous.tagIds, tagId],
      };
    });
  };

  const saveCustomer = async () => {
    if (!draft) {
      throw new Error(copy.notFound);
    }

    const fullName = draft.fullName.trim();
    if (!fullName) {
      throw new Error(copy.nameRequired);
    }

    const phone = draft.phone.trim();
    if (!phone) {
      throw new Error(copy.phoneRequired);
    }

    const phoneCheck = validatePhoneNumber(phone, { allowEmpty: false });
    if (!phoneCheck.isValid) {
      throw new Error(copy.phoneInvalid);
    }

    const nextDetail = await updateMutation.mutateAsync({
      fullName,
      phone,
      socialLink: draft.socialLink || null,
      address: draft.address || null,
      note: draft.note || null,
      isActive: draft.isActive,
      tagIds: draft.tagIds,
    });

    setDraftState(buildDraftFromDetail(nextDetail));
    setSaveMessage(copy.saveSuccess);
  };

  return {
    copy,
    detail,
    detailQuery,
    draft,
    setDraft,
    saveCustomer,
    updateMutation,
    saveMessage,
    setSaveMessage,
    orderStatusFilter,
    setOrderStatusFilter,
    orderStatusOptions,
    filteredOrders,
    draftPhoneValidation,
    toggleTag,
    orderStatusLabels,
  };
}
