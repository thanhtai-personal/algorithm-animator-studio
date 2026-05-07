import { ApiClientError } from "@/lib/httpClient";
import type { ZaloMiniAppMakeupEventDto } from "@/lib/contracts";
import { useZaloMiniAppCalendar, eventCustomerLabel } from "@/features/calendar/hooks/useZaloMiniAppCalendar";
import { dayNumber, eventRangeLabel, isOutsideCurrentMonth } from "@/features/calendar/utils/calendarUtils";

interface ZaloCalendarSectionProps {
  accessToken: string;
  branchId: string | null;
  role: string | null;
  profileId: string | null;
  roleLabel: string;
  displayName: string | null;
  onLogout: () => void;
}

const DAY_HEADERS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const MAX_EVENT_IN_CELL = 3;

function eventPrimaryText(event: ZaloMiniAppMakeupEventDto): string {
  const note = event.note?.trim();
  if (note) return note;

  const packageName = event.packageName?.trim();
  if (packageName) return packageName;

  return eventCustomerLabel(event);
}

function eventToneClass(event: ZaloMiniAppMakeupEventDto, index: number): string {
  if (event.isConflictWarning) return "warning";
  return `tone-${index % 4}`;
}

function eventStatusLabel(status: ZaloMiniAppMakeupEventDto["status"]): string {
  switch (status) {
    case "BOOKED":
      return "Đã đặt";
    case "COMPLETED":
      return "Hoàn thành";
    case "CANCELLED":
      return "Đã hủy";
    default:
      return status;
  }
}

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ZaloCalendarSection({
  accessToken,
  branchId,
  role,
  profileId,
  roleLabel,
  displayName,
  onLogout,
}: ZaloCalendarSectionProps) {
  const model = useZaloMiniAppCalendar(accessToken, branchId, role, profileId);

  const isUnauthorized =
    model.eventsQuery.error instanceof ApiClientError &&
    (model.eventsQuery.error.status === 401 || model.eventsQuery.error.status === 403);

  if (isUnauthorized) {
    return (
      <section className="card error">
        <h3>Không có quyền truy cập</h3>
        <p className="muted">
          {model.eventsQuery.error instanceof Error
            ? model.eventsQuery.error.message
            : "Tài khoản hiện tại không có quyền xem lịch makeup."}
        </p>
        <div className="row gap wrap">
          <button type="button" className="ghost" onClick={onLogout}>
            Đăng xuất và đổi tài khoản
          </button>
        </div>
      </section>
    );
  }

  const headerBadge = displayName ? `${displayName} · ${roleLabel}` : roleLabel;

  const eventsErrorMessage =
    model.eventsQuery.error instanceof ApiClientError
      ? model.eventsQuery.error.message
      : model.eventsQuery.error instanceof Error
        ? model.eventsQuery.error.message
        : "Không tải được danh sách lịch makeup.";

  return (
    <section className="calendar-screen">
      <header className="calendar-hero">
        <div>
          <h2>Lịch makeup đã đặt</h2>
          <p className="muted">Màn hình lịch tháng đồng bộ theo admin makeup calendar.</p>
        </div>
        <span className="badge">{headerBadge}</span>
      </header>

      <section className="calendar-card">
        <header className="calendar-card-head">
          <div className="row between wrap">
            <h3>Lịch makeup theo tháng</h3>
            <p className="month-label">{model.monthLabel}</p>
          </div>

          <div className="row gap wrap">
            {model.canSelectArtist ? (
              <label className="month-picker">
                <span>Chuyên viên</span>
                <select
                  value={model.selectedArtistProfileId}
                  onChange={(event) => model.onSelectArtistProfileId(event.target.value)}
                  disabled={model.artistOptions.length === 0}
                >
                  {model.artistOptions.length === 0 ? <option value="">-</option> : null}
                  {model.artistOptions.map((artist) => (
                    <option key={artist.profileId} value={artist.profileId}>
                      {artist.fullName ?? artist.profileId}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label className="month-picker">
              <span>Chọn tháng</span>
              <input
                type="month"
                value={model.monthInputValue}
                onChange={(event) => model.onSelectMonth(event.target.value)}
              />
            </label>

            <button type="button" className="ghost action-btn" onClick={model.goPrevMonth}>
              Tháng trước
            </button>
            <button type="button" className="ghost action-btn" onClick={model.goToday}>
              Hôm nay
            </button>
            <button type="button" className="ghost action-btn" onClick={model.goNextMonth}>
              Tháng sau
            </button>
          </div>
        </header>

        {model.eventsQuery.isError ? <p className="error-text">{eventsErrorMessage}</p> : null}

        <div className="calendar-grid-wrap">
          <div className="calendar-grid min-width">
            {DAY_HEADERS.map((label) => (
              <p key={label} className="calendar-head-cell">
                {label}
              </p>
            ))}

            {model.monthGrid.flat().map((date) => {
              const events = model.eventsByDate.get(date) ?? [];
              const outside = isOutsideCurrentMonth(date, model.anchorDate);
              const active = date === model.selectedDate;

              return (
                <article
                  key={date}
                  className={`calendar-cell ${outside ? "outside" : ""} ${active ? "active" : ""}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => model.openDayEvents(date)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      model.openDayEvents(date);
                    }
                  }}
                >
                  <button
                    type="button"
                    className="calendar-day-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      model.openDayEvents(date);
                    }}
                  >
                    {dayNumber(date)}
                  </button>

                  <div className="calendar-chip-list">
                    {events.slice(0, MAX_EVENT_IN_CELL).map((event, index) => (
                      <button
                        key={event.id}
                        type="button"
                        className={`calendar-chip ${eventToneClass(event, index)}`}
                        onClick={(clickEvent) => {
                          clickEvent.stopPropagation();
                          model.openDayEvents(date);
                        }}
                      >
                        <span className="calendar-chip-note" title={eventPrimaryText(event)}>
                          {eventPrimaryText(event)}
                        </span>
                        <span className="calendar-chip-time">{eventRangeLabel(event)}</span>
                      </button>
                    ))}

                    {events.length > MAX_EVENT_IN_CELL ? (
                      <button
                        type="button"
                        className="calendar-more-btn"
                        onClick={(clickEvent) => {
                          clickEvent.stopPropagation();
                          model.openDayEvents(date);
                        }}
                      >
                        +{events.length - MAX_EVENT_IN_CELL} xem thêm
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

      </section>

      {model.isDayEventsOpen ? (
        <div className="calendar-modal-overlay" role="presentation" onClick={model.closeDayEvents}>
          <section
            className="calendar-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Danh sách lịch trong ngày"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="calendar-modal-head">
              <div>
                <p className="section-label">Lịch trong ngày</p>
                <p className="selected-day-label">{model.selectedDateLabel}</p>
              </div>
              <button type="button" className="ghost modal-close" onClick={model.closeDayEvents}>
                Đóng
              </button>
            </header>

            {model.eventsQuery.isLoading ? (
              <p className="muted">Đang tải lịch...</p>
            ) : model.selectedDateEvents.length === 0 ? (
              <p className="muted">Chưa có lịch trong ngày đã chọn.</p>
            ) : (
              <div className="selected-event-list">
                {model.selectedDateEvents.map((event, index) => (
                  <button
                    type="button"
                    key={event.id}
                    className={`selected-event-card ${eventToneClass(event, index)}`}
                    onClick={() => model.openEventDetail(event.id)}
                  >
                    <div className="row between">
                      <p className="title" title={eventPrimaryText(event)}>
                        {eventPrimaryText(event)}
                      </p>
                      <span className={`badge ${event.isConflictWarning ? "warning" : "success"}`}>
                        {event.isConflictWarning ? "Cảnh báo" : "Booked"}
                      </span>
                    </div>
                    <p className="muted selected-event-subtitle">
                      {eventRangeLabel(event)} · {eventCustomerLabel(event)}
                    </p>
                    <p className="muted selected-event-subtitle">
                      {(event.artistName ?? event.artistProfileId) || "-"}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}

      {model.activeEvent ? (
        <div className="calendar-modal-overlay detail" role="presentation" onClick={model.closeEventDetail}>
          <section
            className="calendar-modal detail"
            role="dialog"
            aria-modal="true"
            aria-label="Chi tiết lịch makeup"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="calendar-modal-head">
              <div>
                <p className="section-label">Chi tiết lịch booking</p>
                <p className="selected-day-label">{eventPrimaryText(model.activeEvent)}</p>
              </div>
              <button type="button" className="ghost modal-close" onClick={model.closeEventDetail}>
                Đóng
              </button>
            </header>

            <section className="booking-detail-grid">
              <article className="booking-detail-item">
                <p className="label">Trạng thái</p>
                <p className="value">{eventStatusLabel(model.activeEvent.status)}</p>
              </article>
              <article className="booking-detail-item">
                <p className="label">Khung giờ</p>
                <p className="value">{eventRangeLabel(model.activeEvent)}</p>
              </article>
              <article className="booking-detail-item">
                <p className="label">Bắt đầu</p>
                <p className="value">{formatDateTime(model.activeEvent.startAt)}</p>
              </article>
              <article className="booking-detail-item">
                <p className="label">Kết thúc</p>
                <p className="value">{formatDateTime(model.activeEvent.endAt)}</p>
              </article>
              <article className="booking-detail-item">
                <p className="label">Khách hàng</p>
                <p className="value">{eventCustomerLabel(model.activeEvent)}</p>
              </article>
              <article className="booking-detail-item">
                <p className="label">SĐT khách</p>
                <p className="value">{model.activeEvent.customerPhone ?? "-"}</p>
              </article>
              <article className="booking-detail-item">
                <p className="label">Chuyên viên</p>
                <p className="value">{model.activeEvent.artistName ?? model.activeEvent.artistProfileId}</p>
              </article>
              <article className="booking-detail-item">
                <p className="label">Số người</p>
                <p className="value">{model.activeEvent.guestCount}</p>
              </article>
              <article className="booking-detail-item">
                <p className="label">Gói makeup</p>
                <p className="value">
                  {model.activeEvent.packageName ?? model.activeEvent.packageCode ?? "-"}
                </p>
              </article>
              <article className="booking-detail-item">
                <p className="label">Thời lượng</p>
                <p className="value">{model.activeEvent.durationMinutes} phút</p>
              </article>
              <article className="booking-detail-item">
                <p className="label">Giá dịch vụ</p>
                <p className="value">{formatMoney(model.activeEvent.priceAmount)}</p>
              </article>
              <article className="booking-detail-item">
                <p className="label">Phụ phí</p>
                <p className="value">{formatMoney(model.activeEvent.surchargeAmount)}</p>
              </article>
              <article className="booking-detail-item">
                <p className="label">Chi phí</p>
                <p className="value">{formatMoney(model.activeEvent.costAmount)}</p>
              </article>
              <article className="booking-detail-item full">
                <p className="label">Ghi chú</p>
                <p className="value">{model.activeEvent.note?.trim() || "-"}</p>
              </article>
              {model.activeEvent.conflictNote ? (
                <article className="booking-detail-item full warning">
                  <p className="label">Cảnh báo xung đột</p>
                  <p className="value">{model.activeEvent.conflictNote}</p>
                </article>
              ) : null}
            </section>
          </section>
        </div>
      ) : null}
    </section>
  );
}
