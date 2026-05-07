"use client";

import type { AppLocale } from "@/constants/locale";
import type { MakeupOrdersPageModel } from "@/features/makeup/hooks/useMakeupOrdersPage";

interface MakeupOrdersTabSectionProps {
  locale: AppLocale;
  model: MakeupOrdersPageModel;
}

export function MakeupOrdersTabSection({ locale, model }: MakeupOrdersTabSectionProps) {
  return (
    <>
      <section className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
        <h2 className="text-sm font-semibold text-foreground">
          {locale === "vi" ? "Tạo đơn makeup" : "Create makeup order"}
        </h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{locale === "vi" ? "Ngày" : "Date"}</span>
            <input
              type="date"
              value={model.orderDate}
              min={model.orderDate}
              onChange={(event) => model.setOrderDate(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{locale === "vi" ? "Giờ bắt đầu" : "Start time"}</span>
            <input
              type="time"
              value={model.orderStartTime}
              onChange={(event) => model.setOrderStartTime(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{locale === "vi" ? "Giờ kết thúc" : "End time"}</span>
            <input
              type="time"
              value={model.orderEndTime}
              onChange={(event) => model.setOrderEndTime(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{locale === "vi" ? "Chuyên viên" : "Artist"}</span>
            <select
              value={model.orderArtistProfileId}
              onChange={(event) => model.setOrderArtistProfileId(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">-</option>
              {(model.artistsQuery.data?.items ?? []).map((artist) => (
                <option key={artist.profileId} value={artist.profileId}>
                  {artist.fullName ?? artist.profileId}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{locale === "vi" ? "Tên khách hàng" : "Customer name"}</span>
            <input
              type="text"
              value={model.orderCustomerName}
              onChange={(event) => model.setOrderCustomerName(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{locale === "vi" ? "SĐT khách hàng" : "Customer phone"}</span>
            <input
              type="tel"
              value={model.orderCustomerPhone}
              onChange={(event) => model.setOrderCustomerPhone(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground md:col-span-2">
            <span>{locale === "vi" ? "Ghi chú" : "Note"}</span>
            <input
              type="text"
              value={model.orderNote}
              onChange={(event) => model.setOrderNote(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void model.onCreateOrder()}
            disabled={model.createOrderMutation.isPending}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-60"
          >
            {locale === "vi" ? "Tạo đơn makeup" : "Create order"}
          </button>
        </div>
      </section>

      <section className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-sm md:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{locale === "vi" ? "Từ ngày" : "Start date"}</span>
            <input
              type="date"
              value={model.orderStartDate}
              onChange={(event) => model.setOrderStartDate(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{locale === "vi" ? "Đến ngày" : "End date"}</span>
            <input
              type="date"
              value={model.orderEndDate}
              onChange={(event) => model.setOrderEndDate(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{locale === "vi" ? "Trạng thái" : "Status"}</span>
            <select
              value={model.orderStatus}
              onChange={(event) => model.setOrderStatus(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">{locale === "vi" ? "Tất cả" : "All"}</option>
              <option value="BOOKED">BOOKED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>{locale === "vi" ? "Tìm kiếm" : "Search"}</span>
            <input
              type="search"
              value={model.orderSearch}
              onChange={(event) => model.setOrderSearch(event.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
            />
          </label>
        </div>

        <div className="space-y-2">
          {model.orders.map((order) => (
            <article key={order.id} className="rounded-2xl border border-border bg-muted/10 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {order.eventDate} | {model.formatOrderTime(order.startAt, order.endAt)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(order.customerName ?? "-")} | {(order.customerPhone ?? "-")} |{" "}
                    {(order.artistName ?? "-")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {order.note ?? "-"} | {model.formatCurrency(order.priceAmount + order.surchargeAmount)}
                  </p>
                </div>
                <select
                  value={order.status}
                  onChange={(event) =>
                    void model.onUpdateOrderStatus(
                      order.id,
                      event.target.value as "BOOKED" | "COMPLETED" | "CANCELLED"
                    )
                  }
                  className="h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground"
                >
                  <option value="BOOKED">BOOKED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
