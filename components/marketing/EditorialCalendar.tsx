"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { SkeletonPageHeader } from "@/components/Skeleton";

interface CalendarPost {
  id: string;
  content: string;
  platform: string;
  status: string;
  calendarAt: string;
}

const PLATFORM_SHORT: Record<string, string> = {
  TWITTER: "X",
  TIKTOK: "TikTok",
  LINKEDIN: "IN",
  INSTAGRAM: "IG",
  FACEBOOK: "FB",
  YOUTUBE: "YT",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING_APPROVAL: "Pendiente",
  APPROVED: "Aprobado",
  SCHEDULED: "Programado",
  PUBLISHED: "Publicado",
  REJECTED: "Rechazado",
};

function postHref(status: string) {
  if (status === "PUBLISHED") return "/marketing/published";
  if (status === "PENDING_APPROVAL") return "/marketing/pending";
  return "/marketing/approved";
}

function CalendarSkeleton() {
  return (
    <div className="page-pad">
      <SkeletonPageHeader />
      <div className="editorial-calendar-toolbar skeleton-line" style={{ height: 44, marginBottom: "1rem" }} />
      <div className="editorial-calendar-grid editorial-calendar-grid--month">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="editorial-calendar-day editorial-calendar-day--muted">
            <div className="skeleton-line skeleton-line--short" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EditorialCalendar() {
  const [view, setView] = useState<"week" | "month">("month");
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [loading, setLoading] = useState(true);

  const range = useMemo(() => {
    if (view === "week") {
      const start = startOfWeek(cursor, { weekStartsOn: 1 });
      return { from: start, to: endOfWeek(cursor, { weekStartsOn: 1 }), days: 7 };
    }
    const monthStart = startOfMonth(cursor);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const monthEnd = endOfMonth(cursor);
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const totalDays =
      Math.round((gridEnd.getTime() - gridStart.getTime()) / 86400000) + 1;
    return { from: gridStart, to: gridEnd, days: totalDays };
  }, [view, cursor]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: range.from.toISOString(),
        to: range.to.toISOString(),
      });
      const res = await fetch(`/api/marketing/calendar?${params}`);
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setPosts(data.posts || []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to]);

  useEffect(() => {
    load();
  }, [load]);

  const days = useMemo(
    () => Array.from({ length: range.days }, (_, i) => addDays(range.from, i)),
    [range.days, range.from]
  );

  const postsByDay = useMemo(() => {
    const map = new Map<string, CalendarPost[]>();
    for (const post of posts) {
      const key = format(new Date(post.calendarAt), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(post);
    }
    for (const [, list] of map) {
      list.sort(
        (a, b) =>
          new Date(a.calendarAt).getTime() - new Date(b.calendarAt).getTime()
      );
    }
    return map;
  }, [posts]);

  function prev() {
    setCursor((d) => (view === "week" ? addDays(d, -7) : subMonths(d, 1)));
  }

  function next() {
    setCursor((d) => (view === "week" ? addDays(d, 7) : addMonths(d, 1)));
  }

  function goToday() {
    setCursor(view === "week" ? startOfWeek(new Date(), { weekStartsOn: 1 }) : startOfMonth(new Date()));
  }

  const title =
    view === "week"
      ? `Semana del ${format(range.from, "d MMM yyyy", { locale: es })}`
      : format(cursor, "MMMM yyyy", { locale: es });

  if (loading) return <CalendarSkeleton />;

  return (
    <div className="page-pad">
      <header className="page-head">
        <div>
          <h1>Calendario editorial</h1>
          <p className="page-sub">
            Planificación y publicaciones por día — pendientes, programados y en vivo
          </p>
        </div>
      </header>

      <div className="editorial-calendar-toolbar">
        <div className="editorial-calendar-nav">
          <button type="button" className="btn btn-secondary" onClick={prev} aria-label="Anterior">
            ←
          </button>
          <button type="button" className="btn btn-secondary" onClick={goToday}>
            Hoy
          </button>
          <button type="button" className="btn btn-secondary" onClick={next} aria-label="Siguiente">
            →
          </button>
          <strong className="editorial-calendar-title">{title}</strong>
        </div>
        <div className="editorial-calendar-views">
          <button
            type="button"
            className={`filter-chip${view === "week" ? " filter-chip--active" : ""}`}
            onClick={() => {
              setView("week");
              setCursor(startOfWeek(new Date(), { weekStartsOn: 1 }));
            }}
          >
            Semana
          </button>
          <button
            type="button"
            className={`filter-chip${view === "month" ? " filter-chip--active" : ""}`}
            onClick={() => {
              setView("month");
              setCursor(startOfMonth(new Date()));
            }}
          >
            Mes
          </button>
        </div>
      </div>

      <div className="editorial-calendar-legend">
        <span className="editorial-cal-legend-item editorial-cal-legend-item--pending">Pendiente</span>
        <span className="editorial-cal-legend-item editorial-cal-legend-item--approved">Aprobado</span>
        <span className="editorial-cal-legend-item editorial-cal-legend-item--scheduled">Programado</span>
        <span className="editorial-cal-legend-item editorial-cal-legend-item--published">Publicado</span>
      </div>

      <div className="editorial-calendar-weekdays">
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div
        className={`editorial-calendar-grid editorial-calendar-grid--${view}`}
      >
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayPosts = postsByDay.get(key) || [];
          const isToday = isSameDay(day, new Date());
          const muted = view === "month" && !isSameMonth(day, cursor);

          return (
            <div
              key={key}
              className={`editorial-calendar-day${isToday ? " editorial-calendar-day--today" : ""}${
                muted ? " editorial-calendar-day--muted" : ""
              }`}
            >
              <div className="editorial-calendar-day-num">{format(day, "d")}</div>
              <div className="editorial-calendar-events">
                {dayPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={postHref(post.status)}
                    className={`editorial-cal-event editorial-cal-event--${post.status === "PENDING_APPROVAL" ? "pending" : post.status.toLowerCase()}`}
                    title={post.content}
                  >
                    <span className="editorial-cal-event-platform">
                      {PLATFORM_SHORT[post.platform] || post.platform}
                    </span>
                    <span className="editorial-cal-event-text">
                      {post.content.slice(0, 42)}
                      {post.content.length > 42 ? "…" : ""}
                    </span>
                    <span className="editorial-cal-event-status">
                      {STATUS_LABEL[post.status] || post.status}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
