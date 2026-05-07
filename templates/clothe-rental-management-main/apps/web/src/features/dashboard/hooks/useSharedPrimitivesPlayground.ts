"use client";

import { useMemo, useState } from "react";
import type { AppLocale } from "@/constants/locale";
import type {
  DateRangeValue,
  ItemStatus,
  OrderStatus,
  PaymentStatus,
} from "@/types/domainPrimitives";
import { validateDateRange } from "@/utils/validation/dateRange";
import { validatePhoneNumber } from "@/utils/validation/phone";

type PlaygroundCopy = {
  title: string;
  subtitle: string;
  filterApply: string;
  filterReset: string;
  stepsTitle: string;
  stepPrevious: string;
  stepNext: string;
  statusBadgesTitle: string;
  productsTitle: string;
  productsSubtitle: string;
  tableTitle: string;
  tableSubtitle: string;
  tablePagination: string;
  tableHeaders: {
    orderCode: string;
    customer: string;
    status: string;
    total: string;
  };
  formTitle: string;
  moneyInvalid: string;
  moneyNegative: string;
  phoneLabel: string;
  phoneValid: string;
  phoneInvalid: string;
  openDrawer: string;
  closeDrawer: string;
  drawerTitle: string;
  drawerDescription: string;
  drawerCancel: string;
  drawerSave: string;
};

const PLAYGROUND_COPY: Record<AppLocale, PlaygroundCopy> = {
  vi: {
    title: "Khu demo Shared UI Primitives",
    subtitle:
      "Khu demo nội bộ cho DataTable/Filter/Drawer/Stepper/StatusBadge/Money/Date/Voice.",
    filterApply: "Áp dụng",
    filterReset: "Đặt lại",
    stepsTitle: "Stepper tạo đơn",
    stepPrevious: "Lùi bước",
    stepNext: "Tiếp theo",
    statusBadgesTitle: "Nhãn trạng thái",
    productsTitle: "Khung lưới sản phẩm",
    productsSubtitle: "Dùng chung cho module Products và trang phòng trưng bày.",
    tableTitle: "Khung DataTable",
    tableSubtitle: "Bao gồm vùng tiêu đề / tải / trống / phân trang.",
    tablePagination: "Trang 1 / 1",
    tableHeaders: {
      orderCode: "Mã đơn",
      customer: "Khách hàng",
      status: "Trạng thái",
      total: "Tổng tiền",
    },
    formTitle: "Ô nhập tiền + khoảng ngày + voice field",
    moneyInvalid: "Giá trị tiền không hợp lệ.",
    moneyNegative: "Giá trị tiền không được âm.",
    phoneLabel: "Số điện thoại khách",
    phoneValid: "Số điện thoại hợp lệ.",
    phoneInvalid: "Số điện thoại chưa đúng định dạng VN (+84 hoặc 0...).",
    openDrawer: "Mở drawer demo",
    closeDrawer: "Đóng drawer",
    drawerTitle: "Khung drawer form",
    drawerDescription: "Demo đóng/mở + voice dictation field không auto-submit.",
    drawerCancel: "Hủy",
    drawerSave: "Lưu",
  },
  en: {
    title: "Shared UI Primitives Playground",
    subtitle:
      "Internal demo area for DataTable/Filter/Drawer/Stepper/StatusBadge/Money/Date/Voice primitives.",
    filterApply: "Apply",
    filterReset: "Reset",
    stepsTitle: "Order stepper",
    stepPrevious: "Previous",
    stepNext: "Next",
    statusBadgesTitle: "Status badges",
    productsTitle: "Product grid shell",
    productsSubtitle: "Reusable for Products module and showroom page.",
    tableTitle: "DataTable shell",
    tableSubtitle: "Header / loading / empty / pagination slots.",
    tablePagination: "Page 1 / 1",
    tableHeaders: {
      orderCode: "Order",
      customer: "Customer",
      status: "Status",
      total: "Total",
    },
    formTitle: "Money + DateRange + Voice field",
    moneyInvalid: "Invalid money value.",
    moneyNegative: "Amount cannot be negative.",
    phoneLabel: "Customer phone",
    phoneValid: "Phone format is valid.",
    phoneInvalid: "Phone format is invalid for VN-friendly rules.",
    openDrawer: "Open drawer demo",
    closeDrawer: "Close drawer",
    drawerTitle: "Drawer form wrapper",
    drawerDescription: "Demo open/close + voice dictation field without auto-submit.",
    drawerCancel: "Cancel",
    drawerSave: "Save",
  },
};

const FILTER_OPTIONS = [
  { value: "ready", labelVi: "Sẵn sàng", labelEn: "Ready", count: 12 },
  { value: "onRent", labelVi: "Đang thuê", labelEn: "On rent", count: 4 },
  { value: "laundry", labelVi: "Đang giặt", labelEn: "Laundry", count: 2 },
] as const;

const ORDER_STEP_SPECS = [
  {
    key: "customer",
    labelVi: "Khách hàng",
    labelEn: "Customer",
    descriptionVi: "Chọn hoặc tạo khách",
    descriptionEn: "Select or create customer",
  },
  {
    key: "period",
    labelVi: "Thời gian thuê",
    labelEn: "Rental period",
    descriptionVi: "Chọn ngày nhận/trả",
    descriptionEn: "Select pickup/return date",
  },
  {
    key: "items",
    labelVi: "Sản phẩm",
    labelEn: "Items",
    descriptionVi: "Chọn item khả dụng",
    descriptionEn: "Choose available items",
  },
  {
    key: "review",
    labelVi: "Xác nhận",
    labelEn: "Review",
    descriptionVi: "Kiểm tra trước khi tạo đơn",
    descriptionEn: "Review before submit",
  },
] as const;

const SAMPLE_ORDERS: Array<{
  code: string;
  customerName: string;
  status: OrderStatus;
  totalAmount: number;
}> = [
  {
    code: "OD-0001",
    customerName: "Nguyen An",
    status: "RESERVED",
    totalAmount: 1800000,
  },
  {
    code: "OD-0002",
    customerName: "Tran Minh",
    status: "PICKED_UP",
    totalAmount: 2500000,
  },
  {
    code: "OD-0003",
    customerName: "Le Ha",
    status: "COMPLETED",
    totalAmount: 1200000,
  },
];

const SAMPLE_PRODUCTS: Array<{
  id: string;
  title: string;
  subtitle: string;
  tags: string[];
  price: number;
  itemStatus: ItemStatus;
}> = [
  {
    id: "prd-1",
    title: "Ao dai ruby",
    subtitle: "Size M - Mau do",
    tags: ["Ao dai", "Showroom"],
    price: 650000,
    itemStatus: "READY",
  },
  {
    id: "prd-2",
    title: "Vest classic",
    subtitle: "Size L - Mau den",
    tags: ["Vest", "Nam"],
    price: 850000,
    itemStatus: "ON_RENT",
  },
  {
    id: "prd-3",
    title: "Vay da hoi",
    subtitle: "Size S - Mau xanh",
    tags: ["Vay", "Da hoi"],
    price: 920000,
    itemStatus: "LAUNDRY",
  },
];

const PAYMENT_STATUS_SAMPLES: PaymentStatus[] = ["PENDING", "POSTED", "VOIDED"];

const DEFAULT_DATE_RANGE: DateRangeValue = {
  startDate: "",
  endDate: "",
};

export function useSharedPrimitivesPlayground(locale: AppLocale) {
  const copy = PLAYGROUND_COPY[locale];

  const [selectedFilterValues, setSelectedFilterValues] = useState<string[]>(["ready"]);
  const [currentStepIndex, setCurrentStepIndex] = useState(1);
  const [moneyValue, setMoneyValue] = useState<number | null>(2000000);
  const [moneyError, setMoneyError] = useState<"invalid-number" | "negative-not-allowed" | null>(null);
  const [dateRangeValue, setDateRangeValue] = useState<DateRangeValue>(DEFAULT_DATE_RANGE);
  const [phoneValue, setPhoneValue] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [voiceNote, setVoiceNote] = useState("");

  const filterOptions = useMemo(
    () =>
      FILTER_OPTIONS.map((option) => ({
        value: option.value,
        label: locale === "vi" ? option.labelVi : option.labelEn,
        count: option.count,
      })),
    [locale]
  );

  const stepperSteps = useMemo(
    () =>
      ORDER_STEP_SPECS.map((step) => ({
        key: step.key,
        label: locale === "vi" ? step.labelVi : step.labelEn,
        description: locale === "vi" ? step.descriptionVi : step.descriptionEn,
      })),
    [locale]
  );

  const products = useMemo(
    () =>
      SAMPLE_PRODUCTS.map((product) => ({
        ...product,
        primaryActionLabel: locale === "vi" ? "Chọn" : "Select",
        secondaryActionLabel: locale === "vi" ? "Chi tiết" : "Details",
      })),
    [locale]
  );

  const dateRangeValidation = useMemo(
    () => validateDateRange(dateRangeValue, { allowSameDay: false, allowEmpty: true }),
    [dateRangeValue]
  );

  const phoneValidation = useMemo(
    () => validatePhoneNumber(phoneValue, { allowEmpty: true }),
    [phoneValue]
  );

  const toggleFilter = (value: string) => {
    setSelectedFilterValues((previous) => {
      if (previous.includes(value)) {
        return previous.filter((entry) => entry !== value);
      }
      return [...previous, value];
    });
  };

  return {
    copy,
    selectedFilterValues,
    toggleFilter,
    resetFilters: () => setSelectedFilterValues([]),
    filterOptions,
    stepperSteps,
    currentStepIndex,
    setCurrentStepIndex,
    sampleOrders: SAMPLE_ORDERS,
    products,
    paymentStatusSamples: PAYMENT_STATUS_SAMPLES,
    moneyValue,
    setMoneyValue,
    moneyError,
    setMoneyError,
    dateRangeValue,
    setDateRangeValue,
    dateRangeValidation,
    phoneValue,
    setPhoneValue,
    phoneValidation,
    drawerOpen,
    setDrawerOpen,
    voiceNote,
    setVoiceNote,
  };
}
