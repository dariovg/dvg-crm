"use client";

import Link from "next/link";
import { useMemo } from "react";

function startOfWeek(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function CalendarView({ tasks, meetings }) {
  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  function itemsForDay(day) {
    const taskItems = tasks
      .filter((t) => t.dueAt && sameDay(new Date(t.dueAt), day))
      .map((t) => ({
        id: `t-${t.id}`,
        type: "task",
        title: t.title,
        href: `/leads/${t.contactId}`,
        done: t.done,
        priority: t.priority,
      }));

    const meetingItems = meetings
      .filter((m) => {
        const [y, mo, d] = m.date.split("-").map(Number);
        const md = new Date(y, mo - 1, d);
        return sameDay(md, day);
      })
      .map((m) => ({
        id: `m-${m.id}`,
        type: "meeting",
        title: `${m.contact.name} · ${m.time}`,
        href: `/leads/${m.contactId}`,
      }));

    return [...taskItems, ...meetingItems];
  }

  return (
    <div className="calendar-week">
      {days.map((day) => {
        const items = itemsForDay(day);
        const isToday = sameDay(day, new Date());
        return (
          <div
            key={day.toISOString()}
            className={`calendar-day${isToday ? " calendar-day--today" : ""}`}
          >
            <header className="calendar-day-head">
              <span className="calendar-weekday">
                {day.toLocaleDateString("es-ES", { weekday: "short" })}
              </span>
              <span className="calendar-date-num">{day.getDate()}</span>
            </header>
            <ul className="calendar-day-items">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className={`calendar-item calendar-item--${item.type}${item.done ? " calendar-item--done" : ""}`}
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
              {!items.length && (
                <li className="calendar-empty">—</li>
              )}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
