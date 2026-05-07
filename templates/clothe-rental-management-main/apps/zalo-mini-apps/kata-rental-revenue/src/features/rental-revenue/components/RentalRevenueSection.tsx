import { useState } from "react";
import { observer } from "mobx-react-lite";
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  CalendarClock,
  ClipboardList,
  MapPin,
  PackageCheck,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { LoadingStateCard } from "@/components/feedback/LoadingStateCard";
import { ZaloAuthCard } from "@/features/auth/components/ZaloAuthCard";
import { useZaloMiniAppAuth } from "@/features/auth/hooks/useZaloMiniAppAuth";
import {
  DashboardQuickActionsBar,
  type DashboardQuickAction,
} from "@/features/rental-revenue/components/DashboardQuickActionsBar";
import { DashboardStatsPage } from "@/features/rental-revenue/components/DashboardStatsPage";
import {
  DashboardTabPanels,
  type DashboardSectionKey,
  type DashboardMetricCard,
} from "@/features/rental-revenue/components/DashboardTabPanels";
import { DashboardUserMenu } from "@/features/rental-revenue/components/DashboardUserMenu";
import { zaloMiniAppAuthStore } from "@/features/auth/stores/zaloMiniAppAuthStore";
import { useRentalRevenuePage } from "@/features/rental-revenue/hooks/useRentalRevenuePage";
import { formatDashboardDate, formatDashboardMoney } from "@/features/rental-revenue/utils/dashboardPresentation";

const DASHBOARD_TABS: {
  id: DashboardPageKey;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: "overview", label: "Tổng quan", icon: PackageCheck },
  { id: "finance", label: "Doanh thu", icon: TrendingUp },
  { id: "stats", label: "Thống kê", icon: BarChart3 },
  { id: "attention", label: "Quản lý đơn", icon: CalendarClock },
];

type DashboardPageKey = DashboardSectionKey | "stats";
type DashboardSlideDirection = "left" | "right";

export const RentalRevenueSection = observer(function RentalRevenueSection() {
  const model = useRentalRevenuePage();
  const { store } = model;
  const auth = useZaloMiniAppAuth();
  const [activePage, setActivePage] = useState<DashboardPageKey>("overview");
  const [slideDirection, setSlideDirection] = useState<DashboardSlideDirection>("right");
  if (!zaloMiniAppAuthStore.isAuthenticated) {
    return (
      <section className="booking-layout">
        <ZaloAuthCard />
      </section>
    );
  }

  if (model.accessQuery.isLoading && !store.access) {
    return (
      <section className="booking-layout">
        <LoadingStateCard message="Đang tải quyền truy cập bảng điều hành doanh thu..." />
      </section>
    );
  }
  if (model.accessQuery.isError && !store.access) {
    return (
      <section className="booking-layout">
        <section className="zalo-card error">
          <p className="error-text">Không tải được quyền truy cập bảng điều hành doanh thu.</p>
        </section>
      </section>
    );
  }

  const overview = store.overview;
  const report = store.report;
  const kpi = overview?.kpi ?? null;
  const financialKpi = report?.kpi ?? null;
  const currencyCode = report?.currencyCode ?? kpi?.currencyCode ?? "VND";

  const reportFinancialCards: DashboardMetricCard[] = financialKpi
    ? [
        {
          label: "Doanh thu thuần",
          value: formatDashboardMoney(financialKpi.revenueNet, currencyCode),
          tone: "success",
          icon: TrendingUp,
        },
        {
          label: "Lợi nhuận gộp",
          value: formatDashboardMoney(financialKpi.grossProfit, currencyCode),
          tone: financialKpi.grossProfit >= 0 ? "success" : "danger",
          icon: TrendingUp,
        },
        {
          label: "Lợi nhuận bán hàng",
          value: formatDashboardMoney(financialKpi.salesProfit, currencyCode),
          tone: financialKpi.salesProfit >= 0 ? "success" : "danger",
          icon: TrendingUp,
        },
        {
          label: "Lợi nhuận thực tế",
          value: formatDashboardMoney(financialKpi.realProfit, currencyCode),
          tone: financialKpi.realProfit >= 0 ? "success" : "danger",
          icon: TrendingUp,
        },
        {
          label: "Tổng thu thực tế",
          value: formatDashboardMoney(financialKpi.cashInflow, currencyCode),
          tone: "success",
          icon: ClipboardList,
        },
        {
          label: "Tổng chi thực tế",
          value: formatDashboardMoney(financialKpi.cashOutflow, currencyCode),
          tone: "danger",
          icon: AlertCircle,
        },
        {
          label: "Cọc đã thu",
          value: formatDashboardMoney(financialKpi.depositCollectedTotal, currencyCode),
          tone: "success",
          icon: ClipboardList,
        },
        {
          label: "Cọc đã hoàn",
          value: formatDashboardMoney(financialKpi.depositRefundedTotal, currencyCode),
          tone: "danger",
          icon: AlertCircle,
        },
        {
          label: "Tổng công nợ mở",
          value: formatDashboardMoney(financialKpi.outstandingDebt, currencyCode),
          tone: "warning",
          icon: CalendarClock,
        },
      ]
    : [];
  const capitalFinancialCards: DashboardMetricCard[] = kpi
    ? [
        {
          label: "Vốn ban đầu (thuần)",
          value: formatDashboardMoney(kpi.initialCapitalNetTotal, currencyCode),
          tone: kpi.initialCapitalNetTotal >= 0 ? "success" : "danger",
          icon: TrendingUp,
        },
        {
          label: "Tổng chi nhập hàng",
          value: formatDashboardMoney(kpi.importOrderExpenseTotal, currencyCode),
          tone: "danger",
          icon: AlertCircle,
        },
      ]
    : [];
  const financialCards: DashboardMetricCard[] = [
    ...reportFinancialCards,
    ...capitalFinancialCards,
  ];

  const operationalCards: DashboardMetricCard[] = kpi
    ? [
        {
          label: "Đơn đang thuê",
          value: String(kpi.ordersOnRent),
          tone: "neutral",
          icon: PackageCheck,
        },
        {
          label: "Đến hạn hôm nay",
          value: String(kpi.dueToday),
          tone: "warning",
          icon: CalendarClock,
        },
        { label: "Quá hạn", value: String(kpi.overdue), tone: "danger", icon: AlertCircle },
        {
          label: "Đồ trong giặt",
          value: String(kpi.itemsInLaundry),
          tone: "neutral",
          icon: AlertTriangle,
        },
      ]
    : [];
  const currentBranchName =
    store.access?.branches.find((branch) => branch.id === store.branchId)?.name ??
    store.access?.branches.find((branch) => branch.id === store.access?.branchId)?.name ??
    "Chưa chọn chi nhánh";
  const dateRangeLabel = `${formatDashboardDate(store.startDate)} - ${formatDashboardDate(store.endDate)}`;

  function changePage(nextPage: DashboardPageKey) {
    if (nextPage === activePage) return;
    const currentIndex = DASHBOARD_TABS.findIndex((tab) => tab.id === activePage);
    const nextIndex = DASHBOARD_TABS.findIndex((tab) => tab.id === nextPage);
    setSlideDirection(nextIndex > currentIndex ? "right" : "left");
    setActivePage(nextPage);
  }

  const quickActions: DashboardQuickAction[] = [
    { id: "overview", label: "Tổng quan", icon: PackageCheck, onClick: () => changePage("overview") },
    { id: "finance", label: "Doanh thu", icon: TrendingUp, onClick: () => changePage("finance") },
    { id: "stats", label: "Thống kê", icon: BarChart3, onClick: () => changePage("stats") },
    { id: "attention", label: "Quản lý đơn", icon: CalendarClock, onClick: () => changePage("attention") },
  ];

  return (
    <section className="booking-layout dashboard-layout">
      <section className="dashboard-header-shell">
        <div className="app-header-main">
          <div className="app-header-copy">
            <p className="eyebrow">Bảng điều hành KATA</p>
            <h1 className="dashboard-header-title">Tổng quan vận hành</h1>
            <p className="muted">
              Theo dõi nhanh KPI, đơn đến hạn và hoạt động gần đây theo chi nhánh hiện tại.
            </p>
            <div className="dashboard-header-meta">
              <span className="dashboard-header-chip">
                <MapPin className="icon" />
                <span>{currentBranchName}</span>
              </span>
              {kpi ? (
                <span className="dashboard-header-chip">Đồ đã bán: {kpi.soldItemsTotal}</span>
              ) : null}
              {kpi ? (
                <span className="dashboard-header-chip">
                  Biên lợi nhuận: {(((financialKpi?.profitMargin ?? kpi.profitMarginToday) ?? 0) * 100).toFixed(2)}%
                </span>
              ) : null}
              <span className="dashboard-header-period">
                {dateRangeLabel} ·{" "}
                {store.granularity === "day"
                  ? "Theo ngày"
                  : store.granularity === "month"
                    ? "Theo tháng"
                    : "Theo năm"}
              </span>
            </div>
          </div>

          {store.access ? (
            <DashboardUserMenu
              access={store.access}
              branchId={store.branchId}
              startDate={store.startDate}
              endDate={store.endDate}
              granularity={store.granularity}
              onBranchChange={store.setBranchId}
              onStartDateChange={store.setStartDate}
              onEndDateChange={store.setEndDate}
              onGranularityChange={store.setGranularity}
              onDateTranscript={model.handleDateTranscript}
              onLogout={() => void auth.logout()}
            />
          ) : null}
        </div>
      </section>

      {store.voiceReview ? (
        <div className="review-card">
          <strong>Xem lại nội dung trước khi đổi ngày lọc</strong>
          <p className="muted">Nội dung nhận diện: {store.voiceReview.transcript}</p>
          <input
            value={store.voiceReview.suggestedValue}
            onChange={(event) => {
              const currentReview = store.voiceReview;
              if (!currentReview) return;
              store.openVoiceReview({ ...currentReview, suggestedValue: event.target.value });
            }}
          />
          <div className="row gap wrap">
            <button type="button" onClick={() => store.applyVoiceReview()}>
              Áp dụng
            </button>
            <button type="button" className="ghost" onClick={() => store.dismissVoiceReview()}>
              Hủy
            </button>
          </div>
        </div>
      ) : null}

      {model.overviewQuery.isLoading && !overview ? (
        <LoadingStateCard message="Đang tải tổng quan bảng điều hành..." />
      ) : null}

      {model.reportQuery.isLoading && !report ? (
        <LoadingStateCard message="Đang tải tóm tắt tài chính..." />
      ) : null}

      {model.overviewQuery.isError && !overview ? (
        <section className="zalo-card error">
          <p className="error-text">Không tải được tổng quan bảng điều hành cho chi nhánh đã chọn.</p>
        </section>
      ) : null}

      {model.reportQuery.isError && !report ? (
        <section className="zalo-card error">
          <p className="error-text">Không tải được dữ liệu tài chính cho bộ lọc hiện tại.</p>
        </section>
      ) : null}

      <section className="dashboard-page-stage">
        <div key={`${activePage}-${slideDirection}`} className={`dashboard-page-panel slide-${slideDirection}`}>
          {activePage === "stats" ? (
            <DashboardStatsPage
              overview={overview}
              report={report}
            />
          ) : null}

          {activePage !== "stats" ? (
            <DashboardTabPanels
              section={activePage}
              overview={overview}
              report={report}
              operationalCards={operationalCards}
              financialCards={financialCards}
              managedOrders={store.managedOrders}
              managedOrdersStatusFilter={store.managedOrderStatusFilter}
              onManagedOrdersStatusFilterChange={store.setManagedOrderStatusFilter}
              managedOrdersLoading={model.ordersQuery.isLoading}
              managedOrdersError={model.ordersQuery.isError}
            />
          ) : null}
        </div>
      </section>

      <DashboardQuickActionsBar actions={quickActions} activeId={activePage} />
    </section>
  );
});
