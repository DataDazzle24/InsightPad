import {
  stamp,
  dayDate,
  calendarRange,
  advanceCalendar,
} from "./calendarDates";
import { dateTime } from "./money";
export type CalendarEvent = {
  id: string;
  code: string;
  customer_name: string;
  due_at: string;
  status: string;
};
export type CalendarDay = {
  date: string;
  total: number;
  events: CalendarEvent[];
};
export function Calendar({
  anchor,
  period,
  today,
  now,
  zone,
  days,
  onAnchor,
  onPeriod,
  onOpen,
  onDay,
}: {
  anchor: string;
  period: "MONTH" | "WEEK";
  today: string;
  now: string;
  zone: string;
  days: CalendarDay[];
  onAnchor: (anchor: string) => void;
  onPeriod: (period: "MONTH" | "WEEK") => void;
  onOpen: (id: string) => void;
  onDay: (day: string) => void;
}) {
  const range = calendarRange(anchor, period),
    first = dayDate(range.from),
    count = period === "MONTH" ? 42 : 7;
  const title = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(dayDate(anchor));
  return (
    <>
      <div className="table-toolbar">
        <h2>{title}</h2>
        <div className="table-actions">
          <button className="btn" onClick={() => onAnchor(today)}>
            Hoje
          </button>
          <button
            className="btn"
            aria-label="Período anterior"
            onClick={() => onAnchor(advanceCalendar(anchor, period, -1))}
          >
            Anterior
          </button>
          <button
            className="btn"
            aria-label="Próximo período"
            onClick={() => onAnchor(advanceCalendar(anchor, period, 1))}
          >
            Próximo
          </button>
          <select
            aria-label="Período do calendário"
            value={period}
            onChange={(e) => onPeriod(e.target.value as "MONTH" | "WEEK")}
          >
            <option value="MONTH">Mês</option>
            <option value="WEEK">Semana</option>
          </select>
        </div>
      </div>
      <div className="calendar-scroll">
        <div
          className="calendar-grid"
          aria-label={`Calendário de encomendas — ${title}`}
        >
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
            <span key={day} className="weekday">
              {day}
            </span>
          ))}
          {Array.from({ length: count }, (_, index) => {
            const date = new Date(first);
            date.setUTCDate(first.getUTCDate() + index);
            const id = stamp(date),
              entry = days.find((d) => d.date === id),
              isToday = id === today,
              full = new Intl.DateTimeFormat("pt-BR", {
                weekday: "short",
                day: "2-digit",
                month: "short",
                timeZone: "UTC",
              }).format(date);
            return (
              <div
                key={id}
                className={`cal-day${date.getUTCMonth() !== dayDate(anchor).getUTCMonth() ? " other" : ""}${isToday ? " today" : ""}${isToday || entry ? " has-events" : ""}`}
              >
                <span
                  className="day-num"
                  aria-current={isToday ? "date" : undefined}
                >
                  <span className="day-compact">{full}</span>
                  <span className="day-wide">{date.getUTCDate()}</span>
                  {isToday && <span className="today-label">Hoje</span>}
                </span>
                {entry?.events.map((event) => (
                  <button
                    key={event.id}
                    className={`event${event.status === "READY" ? " ready" : ""}${new Date(event.due_at).getTime() < new Date(now).getTime() ? " overdue" : ""}`}
                    onClick={() => onOpen(event.id)}
                  >
                    {dateTime(event.due_at, zone)} · {event.customer_name}
                  </button>
                ))}
                {entry && entry.total > 2 && (
                  <button className="btn quiet" onClick={() => onDay(id)}>
                    +{entry.total - 2} encomendas
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
