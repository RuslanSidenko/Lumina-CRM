'use client'

import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';

interface Meeting {
  id: number;
  lead_id: number;
  agent_id: number;
  title: string;
  provider: string;
  meeting_link: string;
  start_time: string;
  end_time: string;
  status: string;
  lead_name: string;
  agent_name: string;
}

interface MasterCalendarProps {
  token: string;
  onLeadClick: (leadId: number) => void;
}

// ── Local-time helpers ──────────────────────────────────────────────────────
// Build a "YYYY-MM-DD" key from a Date in the USER'S local timezone
const toLocalDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Format local time as HH:MM (24-hour)
const toLocalTime = (isoStr: string): string =>
  new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

// Full local datetime display
const toLocalDateTime = (isoStr: string): string =>
  new Date(isoStr).toLocaleString([], {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });

// User's IANA timezone name (e.g. "Asia/Bangkok")
const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
// ───────────────────────────────────────────────────────────────────────────

export default function MasterCalendar({ token, onLeadClick }: MasterCalendarProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<Meeting | null>(null);

  useEffect(() => {
    fetchMeetings();
  }, [token]);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/meetings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setMeetings(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  // ── Month view ─────────────────────────────────────────────────────────────
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = toLocalDateKey(new Date());
    const days = [];

    // Padding for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`pad-${i}`} className="h-32 border-b border-r border-n-500/20 bg-n-800/10" />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const cellDate = new Date(year, month, d);
      const dateKey = toLocalDateKey(cellDate);
      const isToday = dateKey === today;

      // Filter by LOCAL date — convert each meeting's start_time to local date
      const dayMeetings = meetings.filter(m => toLocalDateKey(new Date(m.start_time)) === dateKey);

      days.push(
        <div
          key={d}
          className={`h-32 border-b border-r border-n-500/20 p-2 overflow-y-auto hover:bg-white/[0.02] transition-colors ${isToday ? 'bg-accent-500/5' : ''}`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className={`text-xs font-bold ${isToday ? 'text-accent-400' : 'text-n-200'}`}>{d}</span>
          </div>
          <div className="space-y-1">
            {dayMeetings.map(m => (
              <button
                key={m.id}
                onClick={() => onLeadClick(m.lead_id)}
                onMouseEnter={() => setTooltip(m)}
                onMouseLeave={() => setTooltip(null)}
                className={`w-full text-left p-1 rounded text-[10px] border group transition-all ${
                  m.provider === 'google'
                    ? 'bg-blue-500/15 border-blue-500/30 text-blue-100 hover:bg-blue-500/25'
                    : 'bg-purple-500/15 border-purple-500/30 text-purple-100 hover:bg-purple-500/25'
                }`}
              >
                <div className="font-bold flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.provider === 'google' ? 'bg-blue-400' : 'bg-purple-400'}`} />
                  {toLocalTime(m.start_time)}
                </div>
                <div className="truncate opacity-90">{m.title}</div>
                <div className="truncate opacity-60 text-[9px]">{m.lead_name} · {m.agent_name}</div>
              </button>
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  // ── Overlap layout ─────────────────────────────────────────────────────────
  const layoutOverlapping = (dayMeetings: Meeting[]) => {
    if (dayMeetings.length === 0) return [];

    const sorted = [...dayMeetings].sort((a, b) => {
      const diff = new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
      if (diff !== 0) return diff;
      return (new Date(b.end_time).getTime() - new Date(b.start_time).getTime()) -
             (new Date(a.end_time).getTime() - new Date(a.start_time).getTime());
    });

    const columns: { end: number; meeting: Meeting }[][] = [];

    for (const m of sorted) {
      const start = new Date(m.start_time).getTime();
      const end = new Date(m.end_time).getTime();
      let placed = false;
      for (let col = 0; col < columns.length; col++) {
        const lastInCol = columns[col][columns[col].length - 1];
        if (lastInCol.end <= start) {
          columns[col].push({ end, meeting: m });
          placed = true;
          break;
        }
      }
      if (!placed) columns.push([{ end, meeting: m }]);
    }

    const result: { meeting: Meeting; colIndex: number; totalCols: number }[] = [];
    for (let col = 0; col < columns.length; col++) {
      for (const entry of columns[col]) {
        const mStart = new Date(entry.meeting.start_time).getTime();
        const mEnd = new Date(entry.meeting.end_time).getTime();
        let overlapping = 0;
        for (let c = 0; c < columns.length; c++) {
          const hasOverlap = columns[c].some(e => {
            const eStart = new Date(e.meeting.start_time).getTime();
            const eEnd = new Date(e.meeting.end_time).getTime();
            return eStart < mEnd && eEnd > mStart;
          });
          if (hasOverlap) overlapping++;
        }
        result.push({ meeting: entry.meeting, colIndex: col, totalCols: overlapping });
      }
    }
    return result;
  };

  // ── Week view ──────────────────────────────────────────────────────────────
  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      weekDays.push(d);
    }

    const HOUR_HEIGHT = 100;
    const TOTAL_HEIGHT = 24 * HOUR_HEIGHT;
    const today = toLocalDateKey(new Date());

    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header: gutter + 7 day labels */}
        <div className="flex border-b border-n-500/40 shrink-0">
          <div className="w-16 shrink-0 border-r border-n-500/40" />
          <div className="flex-1 grid grid-cols-7 divide-x divide-n-500/40">
            {weekDays.map(d => {
              const key = toLocalDateKey(d);
              const isToday = key === today;
              return (
                <div key={key} className="p-3 text-center">
                  <div className="text-[10px] uppercase tracking-widest text-n-300 font-black">
                    {d.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={`text-xl font-black mt-1 ${isToday ? 'text-accent-400' : 'text-n-50'}`}>
                    {d.getDate()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex" style={{ height: `${TOTAL_HEIGHT}px` }}>
            {/* Time gutter */}
            <div className="w-16 shrink-0 relative border-r border-n-500/20">
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute right-2 text-[10px] font-semibold text-n-300 -translate-y-1/2 whitespace-nowrap"
                  style={{ top: `${i * HOUR_HEIGHT}px` }}
                >
                  {i > 0 ? `${String(i).padStart(2, '0')}:00` : ''}
                </div>
              ))}
            </div>

            {/* Day columns */}
            <div className="flex-1 grid grid-cols-7 divide-x divide-n-500/20 relative">
              {/* Hour grid lines */}
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={`line-${i}`}
                  className={`absolute left-0 right-0 border-t ${i % 6 === 0 ? 'border-n-500/30' : 'border-n-500/10'}`}
                  style={{ top: `${i * HOUR_HEIGHT}px` }}
                />
              ))}
              {/* Current time indicator */}
              {(() => {
                const now = new Date();
                const todayKey = toLocalDateKey(now);
                const isThisWeek = weekDays.some(d => toLocalDateKey(d) === todayKey);
                if (!isThisWeek) return null;
                const topPx = (now.getHours() * 60 + now.getMinutes()) * (HOUR_HEIGHT / 60);
                return (
                  <div
                    className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                    style={{ top: `${topPx}px` }}
                  >
                    <div className="w-2 h-2 rounded-full bg-red-400 -ml-1 shrink-0" />
                    <div className="flex-1 border-t-2 border-red-400/70" />
                  </div>
                );
              })()}

              {weekDays.map(d => {
                const dateKey = toLocalDateKey(d);
                // Filter by LOCAL date
                const dayMeetings = meetings.filter(
                  m => toLocalDateKey(new Date(m.start_time)) === dateKey
                );
                const laid = layoutOverlapping(dayMeetings);

                return (
                  <div key={dateKey} className="relative h-full">
                    {laid.map(({ meeting: m, colIndex, totalCols }) => {
                      const localStart = new Date(m.start_time);
                      const localEnd = new Date(m.end_time);
                      // Position using LOCAL hours/minutes
                      const startMin = localStart.getHours() * 60 + localStart.getMinutes();
                      const durationMin = (localEnd.getTime() - localStart.getTime()) / (1000 * 60);
                      const top = startMin * (HOUR_HEIGHT / 60);
                      const height = Math.max(52, durationMin * (HOUR_HEIGHT / 60));
                      const widthPct = 100 / totalCols;
                      const leftPct = colIndex * widthPct;

                      const isGoogle = m.provider === 'google';

                      return (
                        <button
                          key={m.id}
                          onClick={() => onLeadClick(m.lead_id)}
                          onMouseEnter={() => setTooltip(m)}
                          onMouseLeave={() => setTooltip(null)}
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            left: `calc(${leftPct}% + 2px)`,
                            width: `calc(${widthPct}% - 4px)`,
                          }}
                          className={`absolute p-1.5 rounded-md text-[11px] border shadow-md transition-all z-10 overflow-hidden text-left ${
                            isGoogle
                              ? 'bg-blue-500/20 border-blue-500/40 text-blue-50 hover:bg-blue-500/30'
                              : 'bg-purple-500/20 border-purple-500/40 text-purple-50 hover:bg-purple-500/30'
                          }`}
                        >
                          <div className="font-black flex items-center justify-between leading-tight">
                            <span>{toLocalTime(m.start_time)}</span>
                            <span className={`text-[8px] uppercase font-bold px-1 py-0.5 rounded ${isGoogle ? 'bg-blue-500/30' : 'bg-purple-500/30'}`}>
                              {m.provider === 'google' ? 'GMeet' : 'Zoom'}
                            </span>
                          </div>
                          <div className="font-bold mt-0.5 truncate leading-tight">{m.title}</div>
                          <div className="mt-0.5 opacity-80 truncate leading-tight text-[10px]">
                            👤 {m.lead_name}
                          </div>
                          <div className="mt-0.5 opacity-60 truncate leading-tight text-[9px]">
                            🗓 {m.agent_name}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Tooltip popup ─────────────────────────────────────────────────────────
  const renderTooltip = () => {
    if (!tooltip) return null;
    const isGoogle = tooltip.provider === 'google';
    return (
      <div className="fixed bottom-6 right-6 z-50 w-72 card p-4 border border-n-500/40 shadow-2xl bg-n-900/95 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none">
        <div className="flex items-start gap-3">
          <div className={`w-2 h-full min-h-[3rem] rounded-full shrink-0 ${isGoogle ? 'bg-blue-400' : 'bg-purple-400'}`} />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-black text-n-50 truncate">{tooltip.title}</div>
            <div className="text-[11px] text-n-300 mt-1">
              🕐 {toLocalTime(tooltip.start_time)} – {toLocalTime(tooltip.end_time)}
            </div>
            <div className="text-[11px] text-n-300">📅 {new Date(tooltip.start_time).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</div>
            <div className="text-[11px] text-n-300 mt-1">👤 Lead: <span className="text-n-100 font-semibold">{tooltip.lead_name}</span></div>
            <div className="text-[11px] text-n-300">🗓 Agent: <span className="text-n-100 font-semibold">{tooltip.agent_name}</span></div>
            <div className="mt-2 flex items-center gap-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isGoogle ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'}`}>
                {tooltip.provider === 'google' ? 'Google Meet' : 'Zoom'}
              </span>
              <span className="text-[10px] text-n-500">Your time: {userTZ}</span>
            </div>
            <a
              href={tooltip.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-2 flex items-center gap-1 text-[11px] font-semibold underline truncate ${isGoogle ? 'text-blue-300' : 'text-purple-300'}`}
              style={{ pointerEvents: 'auto' }}
            >
              Join meeting ↗
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-3">
            <svg className="w-5 h-5 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Master Calendar
          </h2>
          {/* Timezone badge */}
          <span className="text-[10px] px-2 py-1 rounded-full bg-n-700/60 border border-n-500/30 text-n-300 font-semibold">
            🌐 {userTZ}
          </span>
          <div className="flex bg-n-900/50 p-1 rounded-lg border border-n-500/20">
            <button
              onClick={() => setView('month')}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${view === 'month' ? 'bg-accent-500 text-n-900 shadow-lg' : 'text-n-400 hover:text-n-100'}`}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${view === 'week' ? 'bg-accent-500 text-n-900 shadow-lg' : 'text-n-400 hover:text-n-100'}`}
            >
              Week
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => navigateMonth(-1)} className="btn-ghost p-2 rounded-xl border border-n-500/20">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-sm font-black text-white w-40 text-center">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
          <button onClick={() => navigateMonth(1)} className="btn-ghost p-2 rounded-xl border border-n-500/20">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={() => { setCurrentDate(new Date()); }}
            className="btn-ghost px-3 py-1.5 rounded-xl border border-n-500/20 text-xs font-bold text-n-300 hover:text-n-50"
          >
            Today
          </button>
          <button onClick={fetchMeetings} className="btn-ghost p-2 rounded-xl border border-n-500/20" title="Refresh">
            <svg className={`w-4 h-4 ${loading ? 'animate-spin text-accent-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 card border border-n-500/20 shadow-2xl overflow-hidden flex flex-col bg-n-900/40 backdrop-blur-xl">
        {view === 'month' ? (
          <div className="flex-1 grid grid-cols-7">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-3 text-[10px] font-black uppercase tracking-widest text-center text-n-300 bg-black/20 border-b border-r border-n-500/20">
                {day}
              </div>
            ))}
            {renderMonthView()}
          </div>
        ) : (
          renderWeekView()
        )}
      </div>

      {/* Hover tooltip */}
      {renderTooltip()}
    </div>
  );
}
