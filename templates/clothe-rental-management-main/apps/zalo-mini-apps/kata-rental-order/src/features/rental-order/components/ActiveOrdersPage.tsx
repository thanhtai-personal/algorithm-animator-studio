import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Clock3, Search, X } from "lucide-react";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { useToast } from "@/lib/hooks/use-toast";
import { ApiClientError } from "@/lib/httpClient";
import enMessages from '../../../../../../web/src/lib/languages/en.json';
import viMessages from '../../../../../../web/src/lib/languages/vi.json';
import type { OrderStatus } from "@/lib/contracts";
import type { UseRentalOrderPageResult } from "@/features/rental-order/hooks/useRentalOrderPage";

interface ActiveOrdersPageProps {
  model: UseRentalOrderPageResult;
}

const NEXT_STATUS_ACTIONS: Record<OrderStatus, { toStatus: OrderStatus; label: string } | null> = {
  DRAFT: { toStatus: "CONFIRMED", label: "Xác nhận" },
  RESERVED: { toStatus: "CONFIRMED", label: "Xác nhận" },
  CONFIRMED: { toStatus: "PICKED_UP", label: "Đã nhận đồ" },
  PICKED_UP: { toStatus: "DEBT", label: "Tạo đơn trả" },
  RETURNED: null,
  DEBT: null,
  COMPLETED: null,
  CANCELLED: null,
};

function formatMoney(value: number | null | undefined): string {
  return new Intl.NumberFormat("vi-VN").format(value ?? 0);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  DRAFT: "Nháp",
  RESERVED: "Đặt trước",
  CONFIRMED: "Đã xác nhận",
  PICKED_UP: "Đã nhận đồ",
  RETURNED: "Đã trả đồ",
  DEBT: "Đơn nợ",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
};

const RETURN_ORDER_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Nháp",
  CREATED: "Đã tạo đơn",
  RETURN_SETTLED: "Đã xử lý trả hàng",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
};

const _messages: Record<string, Record<string, string>> = {
  en: enMessages as unknown as Record<string, string>,
  vi: viMessages as unknown as Record<string, string>,
};

function getAppLocale(): "vi" | "en" {
  if (typeof navigator === "undefined") return "vi";
  const lang = (navigator.language || (navigator.languages && navigator.languages[0]) || "vi").toLowerCase();
  return lang.startsWith("vi") ? "vi" : "en";
}

function t(key: string, params?: Record<string, string | number>): string {
  const locale = getAppLocale();
  const routeMessages = _messages[locale] ?? _messages.en;
  const template = routeMessages[key] ?? routeMessages[key] ?? key;
  if (!params) return template;
  return Object.entries(params).reduce((out, [k, v]) => out.replace(new RegExp(`{{${k}}}`, "g"), String(v)), template);
}

function translateReturnOrderStatus(status: string | undefined): string | undefined {
  if (!status) return undefined;
  const parts = status.toLowerCase().split("_");
  const camel = parts.map((p, i) => (i === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1))).join("");
  return t(`returnOrderStatus.${camel}`) || status;
}

export const ActiveOrdersPage = observer(function ActiveOrdersPage({ model }: ActiveOrdersPageProps) {
  const {
    store,
    activeOrdersQuery,
    setActiveOrdersPage,
    activeOrdersSearch,
    setActiveOrdersSearch,
    orderStatusTransitionMutation,
    createReturnOrderMutation,
    selectedOrderId,
    setSelectedOrderId,
    activeOrderDetailQuery,
  } = model;
  const [statusError, setStatusError] = useState<string | null>(null);
  const [transitioningOrderId, setTransitioningOrderId] = useState<string | null>(null);
  const [showReturnDrawer, setShowReturnDrawer] = useState(false);
  const [returnOrderId, setReturnOrderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(store.activeOrdersSearch);
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 350);

  useEffect(() => {
    setActiveOrdersSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, setActiveOrdersSearch]);

  useEffect(() => {
    setSearchTerm(store.activeOrdersSearch);
  }, [store.branchId, store.activeOrdersSearch]);

  const isBranchReady = Boolean(store.branchId && store.access?.branches.length);
  const isLoading = activeOrdersQuery.isLoading || (activeOrdersQuery.isFetching && store.activeOrders.length === 0);
  const orders = activeOrdersQuery.data?.items ?? store.activeOrders;
  const branchLabel = store.access?.branches.find((branch) => branch.id === store.branchId)?.name ?? "Chưa chọn chi nhánh";
  const currentPage = activeOrdersQuery.data?.page ?? 1;
  const pageSize = activeOrdersQuery.data?.pageSize ?? 24;
  const totalItems = activeOrdersQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const orderDetail = activeOrderDetailQuery.data;
  const returnOrder = orders.find((order) => order.id === returnOrderId);
  const isDrawerOpen = Boolean(selectedOrderId || showReturnDrawer);
  const { toast } = useToast();

  const openReturnDrawer = (orderId: string) => {
    setSelectedOrderId(null);
    setReturnOrderId(orderId);
    setShowReturnDrawer(true);
  };

  const closeDrawers = () => {
    setSelectedOrderId(null);
    setShowReturnDrawer(false);
    setReturnOrderId(null);
  };

  const handleTransition = async (orderId: string, toStatus: OrderStatus) => {
    setStatusError(null);
    setTransitioningOrderId(orderId);

    try {
      await orderStatusTransitionMutation.mutateAsync({ orderId, payload: { toStatus } });
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : "Cập nhật trạng thái thất bại");
    } finally {
      setTransitioningOrderId(null);
    }
  };

  return (
    <>
      <section className="zalo-card">
        <div className="section-head section-head-mobile-stack">
          <div>
            <h2>Đơn active</h2>
            <p className="muted">Danh sách đơn đang chạy theo chi nhánh hiện tại và trạng thái active.</p>
          </div>
        </div>

        <div className="grid-list">
          <div className="field">
            <label>
              <span>Tìm đơn</span>
              <div className="search-input-wrap">
                <Search className="icon" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Mã đơn, tên khách hàng"
                />
              </div>
            </label>
          </div>
          <div className="field">
            <span>Chi nhánh</span>
            <div className="branch-label">{branchLabel}</div>
          </div>
        </div>

        {!isBranchReady ? (
          <div className="empty-card">Chọn chi nhánh để xem danh sách đơn active.</div>
        ) : null}

        {statusError ? (
          <section className="zalo-card error">
            <p className="error-text">{statusError}</p>
          </section>
        ) : null}

        {activeOrdersQuery.isError ? (
          <section className="zalo-card error">
            <p className="error-text">
              Không tải được danh sách đơn active.
              {activeOrdersQuery.error instanceof Error ? ` ${activeOrdersQuery.error.message}` : ""}
            </p>
          </section>
        ) : null}

        {isLoading ? (
          <div className="empty-card">
            <Clock3 className="empty-card-icon" />
            <p>Đang tải đơn active...</p>
          </div>
        ) : null}

        {!isLoading && orders.length === 0 && !activeOrdersQuery.isError && isBranchReady ? (
          <div className="empty-card">
            <p>Không có đơn active theo điều kiện tìm kiếm hiện tại.</p>
          </div>
        ) : null}

        {!isLoading && orders.length > 0 ? (
          <div className="order-list">
            {orders.map((order) => {
              const action = NEXT_STATUS_ACTIONS[order.status];
              const isTransitioning = transitioningOrderId === order.id;

              return (
                <article
                  key={order.id}
                  className="order-card"
                  onClick={() => {
                    setShowReturnDrawer(false);
                    setReturnOrderId(null);
                    setSelectedOrderId(order.id);
                  }}
                >
                  <div className="order-card-head">
                    <div>
                      <strong>{order.orderCode}</strong>
                      <p className="muted">{order.customer.fullName}</p>
                    </div>
                    <span className="badge">{ORDER_STATUS_LABEL[order.status] ?? order.status}</span>
                  </div>

                  <div className="grid-list order-card-meta">
                    <div>
                      <p className="muted">Ngày thuê</p>
                      <strong>
                        {formatDate(order.startDate)} - {formatDate(order.endDate)}
                      </strong>
                    </div>
                    <div>
                      <p className="muted">Số lượng</p>
                      <strong>{order.itemCount}</strong>
                    </div>
                    <div>
                      <p className="muted">Tổng tiền</p>
                      <strong>{formatMoney(order.money.totalAmount)}</strong>
                    </div>
                    <div>
                      <p className="muted">Tiền cọc</p>
                      <strong>{formatMoney(order.money.depositAmount)}</strong>
                    </div>
                  </div>

                  <div className="row between">
                    <span className="muted">Cập nhật: {formatDate(order.updatedAt)}</span>
                    {action ? (
                      <button
                        type="button"
                        className="ghost"
                        disabled={orderStatusTransitionMutation.isPending || isTransitioning}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (order.status === "PICKED_UP") {
                            openReturnDrawer(order.id);
                            return;
                          }
                          void handleTransition(order.id, action.toStatus);
                        }}
                      >
                        {isTransitioning ? "Đang cập nhật..." : action.label}
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}

        {totalPages > 1 && !activeOrdersQuery.isError && !isLoading ? (
          <div className="dashboard-order-pagination">
            <p className="muted">
              Trang {currentPage} / {totalPages}
            </p>
            <div className="dashboard-order-pagination-actions">
              <button
                type="button"
                className="ghost"
                disabled={currentPage <= 1}
                onClick={() => setActiveOrdersPage(Math.max(1, currentPage - 1))}
              >
                Trước
              </button>
              <button
                type="button"
                className="ghost"
                disabled={currentPage >= totalPages}
                onClick={() => setActiveOrdersPage(Math.min(totalPages, currentPage + 1))}
              >
                Sau
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <div
        className={`drawer-overlay${isDrawerOpen ? " is-open" : ""}`}
        onClick={closeDrawers}
      />
      <aside className={`right-drawer${isDrawerOpen ? " is-open" : ""}`} aria-labelledby="order-detail-title">
        <div className="right-drawer-head">
          <div>
            <h2 id="order-detail-title">{showReturnDrawer ? "Tạo đơn trả" : "Chi tiết đơn"}</h2>
            {showReturnDrawer ? (
              returnOrder ? <p className="muted">{returnOrder.orderCode}</p> : null
            ) : orderDetail ? (
              <p className="muted">{orderDetail.summary.orderCode}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="drawer-close-button ghost"
            onClick={closeDrawers}
          >
            <X className="icon" />
          </button>
        </div>

        <div className="right-drawer-body">
          {showReturnDrawer ? (
            returnOrder ? (
              <div className="drawer-info-list">
                <div className="drawer-info-card">
                  <span className="drawer-info-label">Mã đơn</span>
                  <strong>{returnOrder.orderCode}</strong>
                </div>
                <div className="drawer-info-card">
                  <span className="drawer-info-label">Trạng thái</span>
                      <strong>{translateReturnOrderStatus(returnOrder.status) ?? returnOrder.status}</strong>
                </div>
                <div className="drawer-info-card">
                  <span className="drawer-info-label">Khách hàng</span>
                  <p>{returnOrder.customer.fullName}</p>
                </div>
                <div className="drawer-info-card">
                  <span className="drawer-info-label">Tổng tiền</span>
                  <strong>{formatMoney(returnOrder.money.totalAmount)}</strong>
                </div>
                <div className="drawer-info-card">
                  <span className="drawer-info-label">Tiền cọc</span>
                  <strong>{formatMoney(returnOrder.money.depositAmount)}</strong>
                </div>
                <div className="drawer-info-card">
                  <span className="drawer-info-label">Số sản phẩm</span>
                  <p>{returnOrder.itemCount}</p>
                </div>
                <button
                  type="button"
                  className="ghost"
                  disabled={createReturnOrderMutation?.isPending}
                  onClick={async () => {
                    if (!returnOrderId || !createReturnOrderMutation) return;
                    setStatusError(null);
                    try {
                      await createReturnOrderMutation.mutateAsync({
                        sourceRentalOrderId: returnOrderId,
                        actualReturnDate: new Date().toISOString().slice(0, 10),
                        status: "CREATED",
                      });

                      // update source order -> DEBT
                      setTransitioningOrderId(returnOrderId);
                      try {
                        await orderStatusTransitionMutation.mutateAsync({
                          orderId: returnOrderId,
                          payload: { toStatus: "DEBT" },
                        });
                      } catch (err) {
                        setStatusError(err instanceof Error ? err.message : "Cập nhật trạng thái thất bại");
                      } finally {
                        setTransitioningOrderId(null);
                      }

                      toast({ title: "Tạo đơn trả thành công", variant: "success" });
                      closeDrawers();
                    } catch (error) {
                      let userMessage = "Tạo đơn trả thất bại";

                      if (error instanceof ApiClientError) {
                        const payload = error.payload as any;
                        const code = payload && typeof payload === "object" && "error" in payload ? payload.error : error.message;
                        const context = payload && typeof payload === "object" && "context" in payload ? payload.context : undefined;

                        userMessage = t(`returnOrder.errors.${code}`) ?? String(code) ?? userMessage;

                        if (code === "RETURN_ORDER_ALREADY_ACTIVE") {
                          void activeOrdersQuery.refetch();
                          const activeReturnId = context?.activeReturnOrderId;
                          const activeReturnStatus = context?.status;
                          const statusLabel = translateReturnOrderStatus(activeReturnStatus) ?? activeReturnStatus;
                          const descParts: string[] = [];
                          if (activeReturnId) descParts.push(`ID đơn trả: ${activeReturnId}`);
                          if (statusLabel) descParts.push(`Trạng thái: ${statusLabel}`);

                          toast({ title: userMessage, description: descParts.join(' · '), variant: 'error' });
                          setStatusError([userMessage, ...descParts].join(' · '));
                          return;
                        }
                      } else if (error instanceof Error) {
                        userMessage = error.message || userMessage;
                      }

                      toast({ title: 'Tạo đơn trả thất bại', description: userMessage, variant: 'error' });
                      setStatusError(userMessage);
                    }
                  }}
                >
                  Xác nhận tạo đơn trả
                </button>
              </div>
            ) : (
              <div className="empty-card">
                <p>Không tìm thấy đơn trả.</p>
              </div>
            )
          ) : activeOrderDetailQuery.isLoading ? (
            <div className="empty-card">
              <Clock3 className="empty-card-icon" />
              <p>Đang tải chi tiết đơn...</p>
            </div>
          ) : activeOrderDetailQuery.isError ? (
            <section className="zalo-card error">
              <p className="error-text">Không tải được chi tiết đơn.</p>
            </section>
          ) : orderDetail ? (
            <div className="drawer-info-list">
              <div className="drawer-info-card">
                <span className="drawer-info-label">Mã đơn</span>
                <strong>{orderDetail.summary.orderCode}</strong>
              </div>

                <div className="drawer-info-card">
                  <span className="drawer-info-label">Trạng thái</span>
                <strong>{ORDER_STATUS_LABEL[orderDetail.summary.status] ?? orderDetail.summary.status}</strong>
              </div>

              <div className="drawer-info-card">
                <span className="drawer-info-label">Số sản phẩm</span>
                <p>{orderDetail.items.length}</p>
                {orderDetail.items.slice(0, 4).map((item) => (
                  <p key={item.orderItemId} className="muted">
                    {item.productName ?? item.itemCode} {item.variantName ? `· ${item.variantName}` : ""}
                  </p>
                ))}
                {orderDetail.items.length > 4 ? (
                  <p className="muted">... và {orderDetail.items.length - 4} mục khác</p>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="empty-card">
              <p>Chọn đơn để xem chi tiết.</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
});
