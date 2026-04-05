'use client'

import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';
import { useTranslations } from 'next-intl';

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

const toLocalDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const toLocalTime = (isoStr: string): string =>
  new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

export default function MasterCalendar({ token, onLeadClick }: MasterCalendarProps) {
  const t = useTranslations('Calendar');
  const tc = useTranslations('Common');
  
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<Meeting | null>(null);

  const currentLocale = typeof document !== 'undefined' ? (document.cookie.match(/NEXT_LOCALE=([^;]+)/)?.[1] || 'en') : 'en';

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

  const cancelMeeting = async (id: number) => {
    if (!confirm(tc('confirm'))) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/meetings/${id}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchMeetings();
        setTooltip(null);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to cancel meeting");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = toLocalDateKey(new Date());
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`pad-${i}`} className="h-32 border-b border-r border-n-500/20 bg-n-800/10" />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const cellDate = new Date(year, month, d);
      const dateKey = toLocalDateKey(cellDate);
      const isToday = dateKey === today;
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
                  m.status === 'cancelled'
                    ? 'bg-n-800/50 border-n-500/10 text-n-500 line-through opacity-60'
                    : m.provider === 'google'
                      ? 'bg-blue-500/15 border-blue-500/30 text-blue-100 hover:bg-blue-500/25'
                      : 'bg-purple-500/15 border-purple-500/30 text-purple-100 hover:bg-purple-500/25'
                }`}
              >
                <div className="font-bold flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.status === 'cancelled' ? 'bg-n-600' : m.provider === 'google' ? 'bg-blue-400' : 'bg-purple-400'}`} />
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

  const layoutOverlapping = (dayMeetings: Meeting[]) => {
    if (dayMeetings.length === 0) return [];
    const sorted = [...dayMeetings].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    const columns: { end: number; meeting: Meeting }[][] = [];

    for (const m of sorted) {
      const start = new Date(m.start_time).getTime();
      const end = new Date(m.end_time).getTime();
      let placed = false;
      for (let col = 0; col < columns.length; col++) {
        if (columns[col][columns[col].length - 1].end <= start) {
          columns[col].push({ end, meeting: m });
          placed = true;
          break;
        }
      }
      if (!placed) columns.push([{ end, meeting: m }]);
    }

    const result: any[] = [];
    for (let col = 0; col < columns.length; col++) {
      for (const entry of columns[col]) {
        const mStart = new Date(entry.meeting.start_time).getTime();
        const mEnd = new Date(entry.meeting.end_time).getTime();
        let overlapping = 0;
        for (let c = 0; c < columns.length; c++) {
          if (columns[c].some(e => new Date(e.meeting.start_time).getTime() < mEnd && new Date(e.meeting.end_time).getTime() > mStart)) overlapping++;
        }
        result.push({ meeting: entry.meeting, colIndex: col, totalCols: overlapping });
      }
    }
    return result;
  };

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
    const today = toLocalDateKey(new Date());

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex border-b border-n-500/40 shrink-0">
          <div className="w-16 shrink-0 border-r border-n-500/40" />
          <div className="flex-1 grid grid-cols-7 divide-x divide-n-500/40">
            {weekDays.map(d => {
              const key = toLocalDateKey(d);
              return (
                <div key={key} className="p-3 text-center">
                  <div className="text-[10px] uppercase tracking-widest text-n-300 font-black">
                    {d.toLocaleDateString(currentLocale === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'short' })}
                  </div>
                  <div className={`text-xl font-black mt-1 ${key === today ? 'text-accent-400' : 'text-n-50'}`}>{d.getDate()}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex relative" style={{ height: '2400px' }}>
            <div className="w-16 shrink-0 border-r border-n-500/20">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="absolute right-2 text-[10px] font-semibold text-n-300 -translate-y-1/2" style={{ top: `${i * HOUR_HEIGHT}px` }}>
                  {i > 0 ? `${String(i).padStart(2, '0')}:00` : ''}
                </div>
              ))}
            </div>

            <div className="flex-1 grid grid-cols-7 divide-x divide-n-500/20 relative">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="absolute left-0 right-0 border-t border-n-500/10" style={{ top: `${i * HOUR_HEIGHT}px` }} />
              ))}
              {weekDays.map(d => {
                const dayMeetings = meetings.filter(m => toLocalDateKey(new Date(m.start_time)) === toLocalDateKey(d));
                const laid = layoutOverlapping(dayMeetings);
                return (
                  <div key={toLocalDateKey(d)} className="relative h-full">
                    {laid.map(({ meeting: m, colIndex, totalCols }: any) => {
                      const start = new Date(m.start_time);
                      const top = (start.getHours() * 60 + start.getMinutes()) * (HOUR_HEIGHT / 60);
                      const height = Math.max(50, ((new Date(m.end_time).getTime() - start.getTime()) / 60000) * (HOUR_HEIGHT / 60));
                      return (
                        <button
                          key={m.id}
                          onClick={() => onLeadClick(m.lead_id)}
                          style={{ top: `${top}px`, height: `${height}px`, left: `${(colIndex / totalCols) * 100}%`, width: `${(1 / totalCols) * 100}%` }}
                          className={`absolute p-1 border rounded z-10 text-left overflow-hidden ${m.status === 'cancelled' ? 'opacity-50 line-through' : m.provider === 'google' ? 'bg-blue-500/20 border-blue-500/40 text-blue-50' : 'bg-purple-500/20 border-purple-500/40 text-purple-50'}`}
                        >
                          <div className="text-[9px] font-bold">{toLocalTime(m.start_time)}</div>
                          <div className="text-[10px] truncate font-black">{m.title}</div>
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

  const renderTooltip = () => {
    if (!tooltip) return null;
    return (
      <div className="fixed bottom-6 right-6 z-50 w-72 card p-4 border border-n-500/40 shadow-2xl bg-n-900/95 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div className="text-xs font-black text-n-50 truncate mb-1">{tooltip.title}</div>
        <div className="text-[11px] text-n-300">🕐 {toLocalTime(tooltip.start_time)} – {toLocalTime(tooltip.end_time)}</div>
        <div className="text-[11px] text-n-300">👤 {tooltip.lead_name}</div>
        <div className="mt-2 flex gap-2">
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-n-800 text-n-300 uppercase font-black tracking-widest">{tooltip.status}</span>
        </div>
        {tooltip.meeting_link && tooltip.status !== 'cancelled' && (
           <a href={tooltip.meeting_link} target="_blank" className="block mt-3 text-[10px] font-bold text-accent-400 hover:underline">JOIN MEETING ↗</a>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-black text-white flex items-center gap-3">
            <svg className="w-5 h-5 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            {t('title')}
          </h2>
          <div className="flex bg-n-900/50 p-1 rounded-lg border border-n-500/20 shadow-inner">
            <button onClick={() => setView('month')} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${view === 'month' ? 'bg-accent-500 text-n-900' : 'text-n-400 hover:text-n-100'}`}>Month</button>
            <button onClick={() => setView('week')} className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${view === 'week' ? 'bg-accent-500 text-n-900' : 'text-n-400 hover:text-n-100'}`}>Week</button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => navigateMonth(-1)} className="btn-ghost p-2 border border-n-500/20 rounded-lg shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="text-sm font-black text-white w-40 text-center uppercase tracking-tighter">
            {currentDate.toLocaleDateString(currentLocale === 'ru' ? 'ru-RU' : 'en-US', { month: 'long', year: 'numeric' })}
          </div>
          <button onClick={() => navigateMonth(1)} className="btn-ghost p-2 border border-n-500/20 rounded-lg shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="btn-ghost px-4 py-2 border border-n-500/20 rounded-lg text-xs font-black uppercase tracking-widest text-n-300 hover:text-n-100">{t('today')}</button>
          <button onClick={fetchMeetings} className="btn-ghost p-2 border border-n-500/20 rounded-lg shadow-sm hover:text-accent-400">
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>
      </div>

      <div className="flex-1 card border border-n-500/20 shadow-2xl overflow-hidden flex flex-col bg-n-900/40 backdrop-blur-xl">
        {view === 'month' ? (
          <div className="flex-1 grid grid-cols-7 border-t border-n-500/10">
            {['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].map(day => (
              <div key={day} className="py-2 text-[9px] font-black uppercase tracking-[0.2em] text-center text-n-500 bg-black/10 border-r border-b border-n-500/20">
                {t(day)}
              </div>
            ))}
            {renderMonthView()}
          </div>
        ) : (
          renderWeekView()
        )}
      </div>
      {renderTooltip()}
    </div>
  );
}
