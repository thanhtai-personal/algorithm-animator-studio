"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AppLocale } from "@/constants/locale";
import {
  CUSTOMERS_DEFAULT_PAGE_SIZE,
  CUSTOMERS_TYPEAHEAD_DEFAULT_LIMIT,
} from "@/features/customers/constants";
import {
  useCreateCustomerMutation,
  useCustomerTypeaheadQuery,
  useCustomersListQuery,
  useUpdateCustomerAnyMutation,
} from "@/features/customers/queries/useCustomersQueries";
import { customersStore } from "@/features/customers/stores/customersStore";
import { useDebouncedValue } from "@/features/customers/utils/useDebouncedValue";
import { useAuthAccess } from "@/features/auth/hooks/guards/useAuthAccess";
import { validatePhoneNumber } from "@/utils/validation/phone";

interface CustomersListCopy {
  title: string;
  subtitle: string;
  createAction: string;
  searchPlaceholder: string;
  tagFilterLabel: string;
  allTags: string;
  tableHeaders: {
    customer: string;
    totalOrders: string;
    totalSpent: string;
    lastOrderDate: string;
    tags: string;
    actions: string;
  };
  viewDetail: string;
  editAction: string;
  addNoteAction: string;
  loading: string;
  empty: string;
  pageLabel: string;
  prevPage: string;
  nextPage: string;
  createPanelTitle: string;
  createPanelDescription: string;
  createSubmit: string;
  createCancel: string;
  createFields: {
    fullName: string;
    phone: string;
    socialLink: string;
    address: string;
    note: string;
    tags: string;
    active: string;
  };
  phoneInvalid: string;
  phoneRequired: string;
  nameRequired: string;
  branchRequired: string;
  createFailed: string;
  quickNotePrompt: string;
  quickNoteFailed: string;
  duplicateHintTitle: string;
}

interface CreateCustomerDraft {
  fullName: string;
  phone: string;
  socialLink: string;
  address: string;
  note: string;
  tagIds: string[];
  isActive: boolean;
}

const CUSTOMERS_LIST_COPY: Record<AppLocale, CustomersListCopy> = {
  vi: {
    title: "Khách hàng",
    subtitle: "CRM lite phục vụ tạo đơn, tra cứu lịch sử thuê và cảnh báo blacklist.",
    createAction: "Tạo khách hàng",
    searchPlaceholder: "Tìm theo tên hoặc số điện thoại...",
    tagFilterLabel: "Tag",
    allTags: "Tất cả tags",
    tableHeaders: {
      customer: "Khách hàng",
      totalOrders: "Tổng đơn",
      totalSpent: "Tổng chi",
      lastOrderDate: "Đơn gần nhất",
      tags: "Tags",
      actions: "Hành động",
    },
    viewDetail: "Chi tiết",
    editAction: "Sửa",
    addNoteAction: "Thêm ghi chú",
    loading: "Đang tải danh sách khách hàng...",
    empty: "Không có khách hàng phù hợp bộ lọc hiện tại.",
    pageLabel: "Trang",
    prevPage: "Trước",
    nextPage: "Sau",
    createPanelTitle: "Tạo khách hàng mới",
    createPanelDescription: "Nhập thông tin liên hệ cơ bản để dùng cho luồng tạo đơn thuê.",
    createSubmit: "Lưu khách hàng",
    createCancel: "Hủy",
    createFields: {
      fullName: "Họ tên",
      phone: "Số điện thoại",
      socialLink: "Liên kết social",
      address: "Địa chỉ",
      note: "Ghi chú",
      tags: "Tags",
      active: "Đang hoạt động",
    },
    phoneInvalid: "Số điện thoại chưa đúng định dạng VN (+84 hoặc 0...).",
    phoneRequired: "Số điện thoại là bắt buộc.",
    nameRequired: "Họ tên khách hàng là bắt buộc.",
    branchRequired: "Bạn chưa có chi nhánh mặc định để tạo khách hàng.",
    createFailed: "Tạo khách hàng thất bại.",
    quickNotePrompt: "Nhập ghi chú nhanh cho khách hàng",
    quickNoteFailed: "Cập nhật ghi chú thất bại.",
    duplicateHintTitle: "Đã có khách gần trùng số điện thoại:",
  },
  en: {
    title: "Customers",
    subtitle: "CRM lite for orders with rental history lookup and blacklist warning tags.",
    createAction: "Create customer",
    searchPlaceholder: "Search by customer name or phone...",
    tagFilterLabel: "Tag",
    allTags: "All tags",
    tableHeaders: {
      customer: "Customer",
      totalOrders: "Total orders",
      totalSpent: "Total spent",
      lastOrderDate: "Last order",
      tags: "Tags",
      actions: "Actions",
    },
    viewDetail: "Detail",
    editAction: "Edit",
    addNoteAction: "Add note",
    loading: "Loading customers...",
    empty: "No customers matched the current filters.",
    pageLabel: "Page",
    prevPage: "Prev",
    nextPage: "Next",
    createPanelTitle: "Create new customer",
    createPanelDescription: "Capture contact information for upcoming rental orders.",
    createSubmit: "Save customer",
    createCancel: "Cancel",
    createFields: {
      fullName: "Full name",
      phone: "Phone",
      socialLink: "Social link",
      address: "Address",
      note: "Note",
      tags: "Tags",
      active: "Active",
    },
    phoneInvalid: "Phone format is invalid for VN-friendly validation.",
    phoneRequired: "Phone number is required.",
    nameRequired: "Customer full name is required.",
    branchRequired: "No default branch found for creating customer.",
    createFailed: "Create customer failed.",
    quickNotePrompt: "Enter quick note",
    quickNoteFailed: "Update note failed.",
    duplicateHintTitle: "Possible duplicate by phone:",
  },
};

const INITIAL_CREATE_DRAFT: CreateCustomerDraft = {
  fullName: "",
  phone: "",
  socialLink: "",
  address: "",
  note: "",
  tagIds: [],
  isActive: true,
};

export function useCustomersListPage(locale: AppLocale) {
  const copy = CUSTOMERS_LIST_COPY[locale];
  const router = useRouter();
  const { currentBranchId } = useAuthAccess();

  const [searchInput, setSearchInput] = useState("");
  const [tagId, setTagId] = useState("");
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState<CreateCustomerDraft>(INITIAL_CREATE_DRAFT);

  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const debouncedPhoneForTypeahead = useDebouncedValue(createDraft.phone, 250);

  const listQuery = useCustomersListQuery({
    branchId: currentBranchId,
    search: debouncedSearch,
    tagId: tagId || null,
    page,
    pageSize: CUSTOMERS_DEFAULT_PAGE_SIZE,
  });

  const phoneTypeaheadQuery = useCustomerTypeaheadQuery({
    branchId: currentBranchId,
    search: debouncedPhoneForTypeahead,
    limit: CUSTOMERS_TYPEAHEAD_DEFAULT_LIMIT,
  });

  const createMutation = useCreateCustomerMutation();
  const updateAnyMutation = useUpdateCustomerAnyMutation();

  const totalPages = (() => {
    if (customersStore.listTotal <= 0) return 1;
    return Math.max(1, Math.ceil(customersStore.listTotal / customersStore.listPageSize));
  })();

  const phoneValidation = useMemo(
    () => validatePhoneNumber(createDraft.phone, { allowEmpty: false }),
    [createDraft.phone]
  );

  const duplicateCandidates = useMemo(() => {
    if (!createOpen) return [];

    const normalized = validatePhoneNumber(createDraft.phone, {
      allowEmpty: true,
    }).normalized;

    const items = customersStore.typeaheadItems;
    if (!normalized) {
      return items.slice(0, 3);
    }

    const exactPhone = items.filter(
      (entry) => entry.phoneNormalized === normalized
    );

    return exactPhone.length > 0 ? exactPhone : items.slice(0, 3);
  }, [createDraft.phone, createOpen]);

  const handleCreateCustomer = async () => {
    const fullName = createDraft.fullName.trim();
    if (!fullName) {
      throw new Error(copy.nameRequired);
    }

    if (!currentBranchId) {
      throw new Error(copy.branchRequired);
    }

    const phone = createDraft.phone.trim();
    if (!phone) {
      throw new Error(copy.phoneRequired);
    }

    const phoneCheck = validatePhoneNumber(phone, { allowEmpty: false });
    if (!phoneCheck.isValid) {
      throw new Error(copy.phoneInvalid);
    }

    const detail = await createMutation.mutateAsync({
      branchId: currentBranchId,
      fullName,
      phone,
      socialLink: createDraft.socialLink || null,
      address: createDraft.address || null,
      note: createDraft.note || null,
      tagIds: createDraft.tagIds,
      isActive: createDraft.isActive,
    });

    setCreateDraft(INITIAL_CREATE_DRAFT);
    setCreateOpen(false);
    router.push(`/${locale}/customers/${detail.customer.id}`);
  };

  const toggleCreateTag = (tagIdValue: string) => {
    setCreateDraft((previous) => {
      if (previous.tagIds.includes(tagIdValue)) {
        return {
          ...previous,
          tagIds: previous.tagIds.filter((entry) => entry !== tagIdValue),
        };
      }

      return {
        ...previous,
        tagIds: [...previous.tagIds, tagIdValue],
      };
    });
  };

  const handleQuickNote = async (customerId: string, note: string) => {
    await updateAnyMutation.mutateAsync({
      customerId,
      payload: {
        note,
      },
    });
  };

  return {
    copy,
    searchInput,
    setSearchInput: (value: string) => {
      setSearchInput(value);
      setPage(1);
    },
    tagId,
    setTagId: (value: string) => {
      setTagId(value);
      setPage(1);
    },
    page,
    setPage,
    totalPages,
    listQuery,
    listItems: customersStore.listItems,
    tags: customersStore.tags,
    createOpen,
    setCreateOpen,
    createDraft,
    setCreateDraft,
    createMutation,
    handleCreateCustomer,
    toggleCreateTag,
    phoneValidation,
    phoneTypeaheadQuery,
    duplicateCandidates,
    handleQuickNote,
    updateAnyMutation,
  };
}
