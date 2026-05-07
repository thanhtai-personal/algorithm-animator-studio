import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { DashboardOrderRowDto } from "@/lib/contracts";
import {
  formatDashboardDate,
  formatDashboardDateTime,
  resolveDashboardStatusLabel,
  resolveDashboardStatusTone,
} from "@/features/rental-revenue/utils/dashboardPresentation";

const ALL_STATUS_VALUE = "__ALL__";
const PAGE_SIZE = 6;
const ORDER_STATUS_FILTER_VALUES = [
  "DRAFT",
  "RESERVED",
  "CONFIRMED",
  "PICKED_UP",
  "RETURNED",
  "DEBT",
  "COMPLETED",
  "CANCELLED",
] as const;

function normalizeOrderStatus(status: string): string {
  return status.trim().toUpperCase();
}

export function DashboardOrderManagementList({
  items,
  statusFilter,
  onStatusFilterChange,
  isLoading,
  isError,
}: {
  items: DashboardOrderRowDto[];
  statusFilter: string;
  onStatusFilterChange: (nextStatus: string) => void;
  isLoading: boolean;
  isError: boolean;
}) {
  const [page, setPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const statusOptions = useMemo(() => {
    const dynamicStatuses = Array.from(
      new Set(items.map((item) => normalizeOrderStatus(item.status)).filter(Boolean))
    ).sort();
    const fixedStatuses = new Set<string>(ORDER_STATUS_FILTER_VALUES);
    const extraStatuses = dynamicStatuses.filter((status) => !fixedStatuses.has(status));
    return [...ORDER_STATUS_FILTER_VALUES, ...extraStatuses];
  }, [items]);

  useEffect(() => {
    if (statusFilter === ALL_STATUS_VALUE) return;
    if (statusOptions.includes(statusFilter)) return;
    onStatusFilterChange(ALL_STATUS_VALUE);
  }, [onStatusFilterChange, statusFilter, statusOptions]);

  const filteredItems = items;

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    if (page <= totalPages) return;
    setPage(totalPages);
  }, [page, totalPages]);

  const pagedItems = useMemo(() => {
    const offset = (page - 1) * PAGE_SIZE;
    return filteredItems.slice(offset, offset + PAGE_SIZE);
  }, [filteredItems, page]);

  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return items.find((item) => item.orderId === selectedOrderId) ?? null;
  }, [items, selectedOrderId]);

  useEffect(() => {
    if (!selectedOrderId) return;
    if (selectedOrder) return;
    setSelectedOrderId(null);
  }, [selectedOrder, selectedOrderId]);

  const isDrawerOpen = selectedOrder !== null;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isDrawerOpen) return;

    const scrollY = window.scrollY;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPosition = body.style.position;
    const previousTop = body.style.top;
    const previousLeft = body.style.left;
    const previousRight = body.style.right;
    const previousWidth = body.style.width;

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";

    return () => {
      body.style.overflow = previousOverflow;
      body.style.position = previousPosition;
      body.style.top = previousTop;
      body.style.left = previousLeft;
      body.style.right = previousRight;
      body.style.width = previousWidth;
      window.scrollTo(0, scrollY);
    };
  }, [isDrawerOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isDrawerOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setSelectedOrderId(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isDrawerOpen]);

  return (
    <>
      <article className="zalo-card dashboard-list-card">
        <div className="dashboard-order-management-head">
          <h2>Quản lý danh sách đơn</h2>
          <label className="dashboard-order-management-filter">
            <span className="drawer-info-label">Trạng thái</span>
            <select
              value={statusFilter}
              onChange={(event) => onStatusFilterChange(event.target.value)}
            >
              <option value={ALL_STATUS_VALUE}>Tất cả</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {resolveDashboardStatusLabel(status)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="muted">Tổng {filteredItems.length} đơn</p>

        {isLoading ? <p className="muted">Đang tải danh sách đơn...</p> : null}
        {isError ? <p className="error-text">Không tải được danh sách đơn quản lý.</p> : null}

        {filteredItems.length === 0 ? (
          <p className="muted">Không có đơn phù hợp với trạng thái đã chọn.</p>
        ) : (
          <>
            <div className="dashboard-order-list">
              {pagedItems.map((order) => (
                <button
                  key={order.orderId}
                  type="button"
                  className="dashboard-order-card dashboard-order-card-button"
                  onClick={() => setSelectedOrderId(order.orderId)}
                  aria-label={`Xem chi tiết đơn ${order.orderCode}`}
                >
                  <div className="row between">
                    <strong>{order.orderCode}</strong>
                    <span className={`status-pill is-${resolveDashboardStatusTone(order.status)}`}>
                      {resolveDashboardStatusLabel(order.status)}
                    </span>
                  </div>
                  <p className="muted">
                    {order.customerName}
                    {order.customerPhone ? ` · ${order.customerPhone}` : ""}
                  </p>
                  <p className="muted">
                    {formatDashboardDate(order.startDate)} - {formatDashboardDate(order.endDate)}
                  </p>
                  <p className="muted">Cập nhật: {formatDashboardDateTime(order.updatedAt)}</p>
                </button>
              ))}
            </div>

            <div className="dashboard-order-pagination">
              <p className="muted">
                Trang {page}/{totalPages}
              </p>
              <div className="dashboard-order-pagination-actions">
                <button
                  type="button"
                  className="ghost"
                  onClick={() => setPage((previous) => Math.max(1, previous - 1))}
                  disabled={page <= 1}
                >
                  Trước
                </button>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => setPage((previous) => Math.min(totalPages, previous + 1))}
                  disabled={page >= totalPages}
                >
                  Sau
                </button>
              </div>
            </div>
          </>
        )}
      </article>

      <button
        type="button"
        className={`drawer-overlay order-detail-overlay ${isDrawerOpen ? "is-open" : ""}`}
        onClick={() => setSelectedOrderId(null)}
        aria-label="Đóng chi tiết đơn"
      />

      <aside className={`right-drawer order-detail-drawer ${isDrawerOpen ? "is-open" : ""}`} aria-hidden={!isDrawerOpen}>
        <div className="right-drawer-head">
          <div>
            <p className="eyebrow">Chi tiết đơn</p>
            <h2>{selectedOrder?.orderCode ?? "--"}</h2>
          </div>
          <button
            type="button"
            className="ghost drawer-close-button"
            onClick={() => setSelectedOrderId(null)}
            aria-label="Đóng chi tiết đơn"
          >
            <X className="icon" />
          </button>
        </div>

        <div className="right-drawer-body">
          <div className="drawer-info-list">
            <div className="drawer-info-card">
              <span className="drawer-info-label">Khách hàng</span>
              <strong>{selectedOrder?.customerName ?? "--"}</strong>
            </div>
            <div className="drawer-info-card">
              <span className="drawer-info-label">Số điện thoại</span>
              <strong>{selectedOrder?.customerPhone ?? "Chưa có số điện thoại"}</strong>
            </div>
            <div className="drawer-info-card">
              <span className="drawer-info-label">Trạng thái</span>
              {selectedOrder ? (
                <span className={`status-pill is-${resolveDashboardStatusTone(selectedOrder.status)}`}>
                  {resolveDashboardStatusLabel(selectedOrder.status)}
                </span>
              ) : (
                <strong>--</strong>
              )}
            </div>
            <div className="drawer-info-card">
              <span className="drawer-info-label">Ngày thuê</span>
              <strong>
                {selectedOrder
                  ? `${formatDashboardDate(selectedOrder.startDate)} - ${formatDashboardDate(selectedOrder.endDate)}`
                  : "--"}
              </strong>
            </div>
            <div className="drawer-info-card">
              <span className="drawer-info-label">Cập nhật gần nhất</span>
              <strong>{selectedOrder ? formatDashboardDateTime(selectedOrder.updatedAt) : "--"}</strong>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
