import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, ClipboardList, DollarSign } from "lucide-react";
import type {
  DashboardOrderRowDto,
  DashboardOverviewResponse,
  RevenueReportResponse,
} from "@/lib/contracts";
import { DashboardOrderManagementList } from "@/features/rental-revenue/components/DashboardOrderManagementList";
import { DashboardRevenueProfitBarChart } from "@/features/rental-revenue/components/DashboardTemplateCharts";
import {
  buildDashboardRevenueTrendRows,
  formatDashboardDateTime,
  resolveDashboardActivityLabel,
  type DashboardTone,
} from "@/features/rental-revenue/utils/dashboardPresentation";

export type DashboardSectionKey = "overview" | "finance" | "attention";

function DashboardSectionBlock({
  id,
  title,
  icon,
  children,
}: {
  id: DashboardSectionKey;
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={`dashboard-section-${id}`} className="dashboard-section-block">
      <div className="dashboard-section-head">
        <div className="dashboard-section-title-row">
          <span className="dashboard-section-title-icon">{icon}</span>
          <h2>{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

export interface DashboardMetricCard {
  label: string;
  value: string;
  tone: DashboardTone;
  icon: LucideIcon;
}

function DashboardMetricGrid({
  cards,
  compact = false,
}: {
  cards: DashboardMetricCard[];
  compact?: boolean;
}) {
  return (
    <section className={`dashboard-kpi-grid${compact ? " compact" : ""}`}>
      {cards.map((card) => (
        <article key={card.label} className={`dashboard-kpi-card${compact ? " compact" : ""}`}>
          <div className="dashboard-kpi-head">
            <p className="muted">{card.label}</p>
            <span className={`dashboard-icon-pill is-${card.tone}`}>
              <card.icon className="icon" />
            </span>
          </div>
          <strong className={compact ? "dashboard-kpi-number" : `dashboard-kpi-value is-${card.tone}`}>
            {card.value}
          </strong>
        </article>
      ))}
    </section>
  );
}

export function DashboardTabPanels({
  section,
  overview,
  report,
  operationalCards,
  financialCards,
  managedOrders,
  managedOrdersStatusFilter,
  onManagedOrdersStatusFilterChange,
  managedOrdersLoading,
  managedOrdersError,
}: {
  section: DashboardSectionKey;
  overview: DashboardOverviewResponse | null;
  report: RevenueReportResponse | null;
  operationalCards: DashboardMetricCard[];
  financialCards: DashboardMetricCard[];
  managedOrders: DashboardOrderRowDto[];
  managedOrdersStatusFilter: string;
  onManagedOrdersStatusFilterChange: (nextStatus: string) => void;
  managedOrdersLoading: boolean;
  managedOrdersError: boolean;
}) {
  const revenueTrendRows = buildDashboardRevenueTrendRows(
    report?.dailyRows ?? [],
    report?.startDate ?? null,
    report?.endDate ?? null,
    report?.granularity ?? "day"
  );
  const revenueProfitChartData = revenueTrendRows.map((row) => ({
    label: row.label,
    revenue: row.revenueNet,
    profit: row.realProfit,
  }));
  const periodLabel =
    report?.granularity === "month"
      ? "tháng"
      : report?.granularity === "year"
        ? "năm"
        : "ngày";

  if (section === "overview") {
    return (
      <DashboardSectionBlock
        id="overview"
        title="Tổng quan vận hành"
        icon={<ClipboardList className="icon" />}
      >
        <section className="dashboard-panel-grid">
          {operationalCards.length > 0 ? (
            <article className="zalo-card">
              <h2>Chỉ số vận hành</h2>
              <DashboardMetricGrid cards={operationalCards} compact />
            </article>
          ) : null}

          <article className="zalo-card">
            <h2>Biểu đồ doanh thu/lợi nhuận</h2>
            <p className="muted">Theo {periodLabel} trong kỳ chọn</p>

            {revenueProfitChartData.length === 0 ? (
              <p className="muted">Chưa có dữ liệu doanh thu theo bộ lọc đã chọn.</p>
            ) : null}

            {revenueProfitChartData.length > 0 ? (
              <DashboardRevenueProfitBarChart data={revenueProfitChartData} />
            ) : null}
          </article>

        </section>
      </DashboardSectionBlock>
    );
  }

  if (section === "finance") {
    return (
      <DashboardSectionBlock
        id="finance"
        title="Doanh thu và dòng tiền"
        icon={<DollarSign className="icon" />}
      >
        <section className="dashboard-panel-grid">
          {financialCards.length > 0 ? (
            <article className="zalo-card">
              <h2>KPI tài chính</h2>
              <DashboardMetricGrid cards={financialCards} />
            </article>
          ) : null}

          {!report?.kpi ? (
            <article className="zalo-card">
              <p className="muted">Không có dữ liệu tài chính trong khoảng đã chọn.</p>
            </article>
          ) : null}
        </section>
      </DashboardSectionBlock>
    );
  }

  return (
    <DashboardSectionBlock
      id="attention"
      title="Quản lý đơn"
      icon={<AlertTriangle className="icon" />}
    >
      <section className="dashboard-panel-grid">
        <DashboardOrderManagementList
          items={managedOrders}
          statusFilter={managedOrdersStatusFilter}
          onStatusFilterChange={onManagedOrdersStatusFilterChange}
          isLoading={managedOrdersLoading}
          isError={managedOrdersError}
        />

        <article className="zalo-card dashboard-list-card">
          <h2>Hoạt động gần đây</h2>

          {overview?.recentActivities.length ? null : (
            <p className="muted">Chưa có hoạt động gần đây.</p>
          )}

          <div className="activity-list">
            {(overview?.recentActivities ?? []).map((activity) => (
              <article key={activity.id} className="activity-card">
                <div className="row between">
                  <strong>{resolveDashboardActivityLabel(activity)}</strong>
                  <span className="activity-time">
                    {formatDashboardDateTime(activity.createdAt)}
                  </span>
                </div>
                <p className="muted">{activity.actorName ?? "Không rõ người thao tác"}</p>
                {activity.reason ? <p className="muted">{activity.reason}</p> : null}
              </article>
            ))}
          </div>
        </article>
      </section>
    </DashboardSectionBlock>
  );
}
