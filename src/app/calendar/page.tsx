"use client";

import { useEffect, useState } from "react";

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDayLabel(d: Date) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${days[d.getDay()]} ${d.getDate()}`;
}

function DayCell({ date, events }: { date: Date; events: any[] }) {
  const isToday = toISODate(date) === toISODate(new Date());
  return (
    <div
      className={`rounded-xl border p-2 text-xs ${
        isToday ? "border-blue-500 bg-blue-50" : "border-zinc-200 bg-white"
      }`}
    >
      <div className="mb-1 font-semibold text-zinc-700">{formatDayLabel(date)}</div>
      {events.length === 0 && <div className="text-zinc-400">—</div>}
      {events.map((e) => (
        <div key={e.id} className="truncate text-zinc-800">
          S{e.season}E{e.number}
        </div>
      ))}
    </div>
  );
}

export default function CalendarPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
  const [eventsByDate, setEventsByDate] = useState<Record<string, any[]>>({});

  useEffect(() => {
    fetch("/api/schedule")
      .then((r) => r.json())
      .then((data) => {
        const map: Record<string, any[]> = {};
        for (const e of data.episodes ?? []) {
          const key = e.airdate;
          if (!map[key]) map[key] = [];
          map[key].push(e);
        }
        setEventsByDate(map);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
        <p className="mt-1 text-sm text-zinc-600">Next 14 days of your followed shows.</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
        {days.map((d) => (
          <DayCell key={d.toISOString()} date={d} events={eventsByDate[toISODate(d)] ?? []} />
        ))}
      </div>
    </div>
  );
}