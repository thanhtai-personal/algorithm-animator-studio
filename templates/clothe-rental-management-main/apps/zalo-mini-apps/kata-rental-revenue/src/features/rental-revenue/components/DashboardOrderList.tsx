import type { DashboardOrderRowDto } from "@/lib/contracts";
import {
  formatDashboardDate,
  formatDashboardDateTime,
  resolveDashboardStatusLabel,
  resolveDashboardStatusTone,
} from "@/features/rental-revenue/utils/dashboardPresentation";

export function DashboardOrderList({
  title,
  emptyMessage,
  items,
  showUpdatedAt = false,
}: {
  title: string;
  emptyMessage: string;
  items: DashboardOrderRowDto[];
  showUpdatedAt?: boolean;
}) {
  return (
    <article className="zalo-card dashboard-list-card">
      <h2>{title}</h2>

      {items.length === 0 ? <p className="muted">{emptyMessage}</p> : null}

      <div className="dashboard-order-list">
        {items.map((order) => (
          <article key={order.orderId} className="dashboard-order-card">
            <div className="row between">
              <strong>{order.orderCode}</strong>
              <span className={`status-pill is-${resolveDashboardStatusTone(order.status)}`}>
                {resolveDashboardStatusLabel(order.status)}
              </span>
            </div>
            <p className="muted">{order.customerName}</p>
            <p className="muted">
              {formatDashboardDate(order.startDate)} - {formatDashboardDate(order.endDate)}
            </p>
            {showUpdatedAt ? (
              <p className="muted">Cập nhật: {formatDashboardDateTime(order.updatedAt)}</p>
            ) : null}
          </article>
        ))}
      </div>
    </article>
  );
}
