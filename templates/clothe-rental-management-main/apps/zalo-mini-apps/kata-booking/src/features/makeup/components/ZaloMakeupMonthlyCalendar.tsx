import type { ZaloMiniAppMakeupBookingModel } from "@/features/makeup/hooks/useZaloMiniAppMakeupBooking";
import { eventRangeLabel } from "@/features/makeup/utils/makeupBookingUtils";

interface ZaloMakeupMonthlyCalendarProps {
  model: ZaloMiniAppMakeupBookingModel;
}

const MAX_EVENT_IN_CELL = 2;
const DAY_HEADERS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function dayNumber(date: string): string {
  return date.slice(8, 10);
}

function isOutsideCurrentMonth(date: string, anchorDate: Date): boolean {
  const [yearText, monthText] = date.split("-");
  const year = Number.parseInt(yearText ?? "0", 10);
  const month = Number.parseInt(monthText ?? "0", 10);

  return year !== anchorDate.getFullYear() || month !== anchorDate.getMonth() + 1;
}

export function ZaloMakeupMonthlyCalendar({ model }: ZaloMakeupMonthlyCalendarProps) {
  return (
    <section className="calendar-wrap">
      <header className="calendar-header">
        <h3>Lich makeup theo thang</h3>
        <span className="badge">{model.monthLabel}</span>
      </header>

      <div className="row gap wrap">
        <button type="button" className="ghost" onClick={model.goPrevMonth}>
          Thang truoc
        </button>
        <button type="button" className="ghost" onClick={model.goToday}>
          Hom nay
        </button>
        <button type="button" className="ghost" onClick={model.goNextMonth}>
          Thang sau
        </button>
      </div>

      <div className="calendar-grid">
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
            >
              <button
                type="button"
                className="calendar-day-btn"
                onClick={() => model.setSelectedDate(date)}
              >
                {dayNumber(date)}
              </button>

              <div className="calendar-chip-list">
                {events.slice(0, MAX_EVENT_IN_CELL).map((event) => (
                  <span
                    key={event.id}
                    className={`calendar-chip ${event.isConflictWarning ? "warning" : ""}`}
                  >
                    {eventRangeLabel(event)}
                  </span>
                ))}

                {events.length > MAX_EVENT_IN_CELL ? (
                  <span className="calendar-more">+{events.length - MAX_EVENT_IN_CELL} them</span>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      <section className="calendar-selected">
        <p className="title">Lich trong ngay {model.selectedDate}</p>
        {model.selectedDateEvents.length === 0 ? (
          <p className="muted">Chua co lich trong ngay da chon.</p>
        ) : (
          <ul className="plain-list">
            {model.selectedDateEvents.map((event) => (
              <li key={event.id} className="row between">
                <span>{eventRangeLabel(event)}</span>
                <span className={`badge ${event.isConflictWarning ? "warning" : "success"}`}>
                  {event.isConflictWarning ? "Conflict" : "Booked"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
