"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CalendarEventForm from "@/components/CalendarEventForm";
import { EVENT_CATEGORIES, parseMeetingDate } from "@/lib/team-calendar";

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

function formatWeekLabel(weekStart) {
  const weekEnd = addDays(weekStart, 6);
  const opts = { day: "numeric", month: "short" };
  return `${weekStart.toLocaleDateString("es-ES", opts)} – ${weekEnd.toLocaleDateString("es-ES", { ...opts, year: "numeric" })}`;
}

function toWeekParam(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function CalendarView({
  tasks,
  meetings,
  teamEvents = [],
  canManage = false,
  weekStartIso,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const weekStart = useMemo(
    () => (weekStartIso ? new Date(weekStartIso) : startOfWeek(new Date())),
    [weekStartIso]
  );
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  function goWeek(offset) {
    const next = addDays(weekStart, offset * 7);
    const params = new URLSearchParams(searchParams.toString());
    params.set("week", toWeekParam(next));
    router.push(`/calendar?${params.toString()}`);
  }

  function openCreate() {
    setEditEvent(null);
    setShowForm(true);
    setSelectedEvent(null);
  }

  function openEdit(event) {
    setEditEvent(event);
    setShowForm(true);
    setSelectedEvent(null);
  }

  function closeForm() {
    setShowForm(false);
    setEditEvent(null);
  }

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
        const md = parseMeetingDate(m.date);
        return md && sameDay(md, day);
      })
      .map((m) => ({
        id: `m-${m.id}`,
        type: "meeting",
        title: `${m.contact.name} · ${m.time}`,
        href: `/leads/${m.contactId}`,
      }));

    const teamItems = teamEvents
      .filter((e) => sameDay(new Date(e.startsAt), day))
      .map((e) => ({
        id: `e-${e.id}`,
        type: "team",
        category: e.category,
        title: e.title,
        event: e,
        time: new Date(e.startsAt).toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));

    return [...teamItems, ...meetingItems, ...taskItems].sort((a, b) => {
      if (a.type === "team" && b.type === "team") {
        return (a.time || "").localeCompare(b.time || "");
      }
      return 0;
    });
  }

  return (
    <div className="calendar-page-wrap">
      <div className="calendar-toolbar">
        <div className="calendar-toolbar-nav">
          <button type="button" className="btn-sm btn-ghost" onClick={() => goWeek(-1)}>
            ← Semana anterior
          </button>
          <strong className="calendar-week-label">{formatWeekLabel(weekStart)}</strong>
          <button type="button" className="btn-sm btn-ghost" onClick={() => goWeek(1)}>
            Semana siguiente →
          </button>
          <button
            type="button"
            className="btn-sm btn-ghost"
            onClick={() => router.push("/calendar")}
          >
            Hoy
          </button>
        </div>
        {canManage && (
          <button type="button" className="btn-primary" onClick={openCreate}>
            + Nuevo evento
          </button>
        )}
      </div>

      {showForm && (
        <CalendarEventForm
          event={editEvent}
          onDone={closeForm}
          onCancel={closeForm}
        />
      )}

      <div className="calendar-legend">
        <span className="calendar-legend-item calendar-legend-item--team">Evento equipo</span>
        <span className="calendar-legend-item calendar-legend-item--meeting">Cita lead</span>
        <span className="calendar-legend-item calendar-legend-item--task">Tarea</span>
      </div>

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
                {items.map((item) =>
                  item.type === "team" ? (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={`calendar-item calendar-item--team calendar-item--event-${item.category.toLowerCase()}`}
                        onClick={() => setSelectedEvent(item.event)}
                      >
                        <span className="calendar-item-time">{item.time}</span>
                        {item.title}
                      </button>
                    </li>
                  ) : (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        className={`calendar-item calendar-item--${item.type}${item.done ? " calendar-item--done" : ""}`}
                      >
                        {item.title}
                      </Link>
                    </li>
                  )
                )}
                {!items.length && <li className="calendar-empty">—</li>}
              </ul>
            </div>
          );
        })}
      </div>

      {selectedEvent && (
        <>
          <div className="calendar-modal-backdrop" onClick={() => setSelectedEvent(null)} />
          <div className="calendar-event-modal card" role="dialog">
            <div className="calendar-event-modal-head">
              <span className={`calendar-event-badge calendar-event-badge--${selectedEvent.category.toLowerCase()}`}>
                {EVENT_CATEGORIES[selectedEvent.category]?.label || selectedEvent.category}
              </span>
              {canManage && (
                <button
                  type="button"
                  className="btn-sm btn-ghost"
                  onClick={() => openEdit(selectedEvent)}
                >
                  Editar
                </button>
              )}
            </div>
            <h3>{selectedEvent.title}</h3>
            <p className="calendar-event-when">
              {new Date(selectedEvent.startsAt).toLocaleString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}
              {selectedEvent.endsAt &&
                ` – ${new Date(selectedEvent.endsAt).toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`}
            </p>
            {selectedEvent.location && (
              <p className="calendar-event-location">{selectedEvent.location}</p>
            )}
            {selectedEvent.description && (
              <p className="calendar-event-desc">{selectedEvent.description}</p>
            )}
            {selectedEvent.createdBy?.name && (
              <p className="muted calendar-event-meta">
                Creado por {selectedEvent.createdBy.name || selectedEvent.createdBy.email}
              </p>
            )}
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setSelectedEvent(null)}
            >
              Cerrar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
