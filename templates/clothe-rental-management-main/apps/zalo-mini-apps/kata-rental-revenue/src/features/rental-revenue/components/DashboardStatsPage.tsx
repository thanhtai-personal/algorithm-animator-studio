import type { ReactNode } from "react";
import { BarChart3 } from "lucide-react";
import type { DashboardOverviewResponse, RevenueReportResponse } from "@/lib/contracts";
import {
  DashboardRevenueAreaChart,
  DashboardSingleAreaChart,
} from "@/features/rental-revenue/components/DashboardTemplateCharts";
import {
  buildDashboardActivityTrendRows,
  buildDashboardRevenueTrendRows,
} from "@/features/rental-revenue/utils/dashboardPresentation";

function DashboardChartCard({
  eyebrow,
  title,
  emptyMessage,
  children,
}: {
  eyebrow: string;
  title: string;
  emptyMessage: string;
  children: ReactNode;
}) {
  return (
    <article className="zalo-card">
      <div className="dashboard-section-head">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
      </div>
      {children ?? <p className="muted">{emptyMessage}</p>}
    </article>
  );
}

export function DashboardStatsPage({
  overview,
  report,
}: {
  overview: DashboardOverviewResponse | null;
  report: RevenueReportResponse | null;
}) {
  const kpi = overview?.kpi ?? null;
  const revenueTrendRows = buildDashboardRevenueTrendRows(
    report?.dailyRows ?? [],
    report?.startDate ?? null,
    report?.endDate ?? null,
    report?.granularity ?? "day"
  );
  const activityTrendRows = buildDashboardActivityTrendRows(overview?.recentActivities ?? []);
  const operationalRows = kpi
    ? [
        { id: "ordersOnRent", label: "Đơn đang thuê", value: kpi.ordersOnRent },
        { id: "dueToday", label: "Đến hạn hôm nay", value: kpi.dueToday },
        { id: "overdue", label: "Quá hạn", value: kpi.overdue },
        { id: "itemsInLaundry", label: "Đồ trong giặt", value: kpi.itemsInLaundry },
      ]
    : [];
  const revenueChartData = revenueTrendRows.map((row) => ({
    label: row.label,
    revenue: row.revenueNet,
    profit: row.realProfit,
  }));
  const operationalChartData = operationalRows.map((row) => ({
    label: row.label,
    value: row.value,
  }));
  const activityChartData = activityTrendRows.map((row) => ({
    label: row.label,
    value: row.count,
  }));

  return (
    <section className="dashboard-section-block">
      <div className="dashboard-section-head">
        <div className="dashboard-section-title-row">
          <span className="dashboard-section-title-icon">
            <BarChart3 className="icon" />
          </span>
          <h2>Biểu đồ thống kê</h2>
        </div>
      </div>

      <section className="dashboard-panel-grid">
        <DashboardChartCard
          eyebrow="Biểu đồ doanh thu/lợi nhuận"
          title="Theo ngày trong kỳ chọn"
          emptyMessage="Chưa có dữ liệu xu hướng doanh thu."
        >
          {revenueChartData.length === 0 ? (
            <p className="muted">Chưa có dữ liệu xu hướng doanh thu.</p>
          ) : (
            <DashboardRevenueAreaChart data={revenueChartData} />
          )}
        </DashboardChartCard>

        <DashboardChartCard
          eyebrow="Tổng quan vận hành"
          title="Theo dõi đơn và giặt ủi"
          emptyMessage="Chưa có dữ liệu vận hành."
        >
          {operationalChartData.length === 0 ? (
            <p className="muted">Chưa có dữ liệu vận hành.</p>
          ) : (
            <DashboardSingleAreaChart
              data={operationalChartData}
              valueLabel="Số lượng"
              tone="primary"
            />
          )}
        </DashboardChartCard>

        <DashboardChartCard
          eyebrow="Hoạt động 7 ngày gần nhất"
          title="Số lượng thao tác theo ngày"
          emptyMessage="Chưa có dữ liệu hoạt động."
        >
          {activityChartData.length === 0 ? (
            <p className="muted">Chưa có dữ liệu hoạt động.</p>
          ) : (
            <DashboardSingleAreaChart
              data={activityChartData}
              valueLabel="Sự kiện"
              tone="warning"
            />
          )}
        </DashboardChartCard>
      </section>
    </section>
  );
}
