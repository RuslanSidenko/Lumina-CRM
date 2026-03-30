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
  created_at: string;
  lead_name: string;
  agent_name: string;
}

interface LeadMeetingsProps {
  leadId: number;
  token: string;
}

const toLocalTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

const toLocalDate = (iso: string) =>
  new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

export default function LeadMeetings({ leadId, token }: LeadMeetingsProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMeetings();
  }, [leadId, token]);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/meetings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const all: Meeting[] = await res.json();
        setMeetings(all.filter(m => m.lead_id === leadId));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-n-400 text-sm py-2">
        <div className="w-3 h-3 rounded-full border-2 border-accent-400 border-t-transparent animate-spin" />
        Loading meetings...
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="text-sm text-n-500 italic py-2">No meetings scheduled for this lead yet.</div>
    );
  }

  const now = new Date();
  const upcoming = meetings.filter(m => new Date(m.start_time) >= now).sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );
  const past = meetings.filter(m => new Date(m.start_time) < now).sort(
    (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
  );

  const MeetingCard = ({ m }: { m: Meeting }) => {
    const isGoogle = m.provider === 'google';
    const isPast = new Date(m.start_time) < now;

    return (
      <div className={`flex gap-3 p-3 rounded-xl border transition-all ${
        isPast
          ? 'bg-n-800/20 border-n-500/20 opacity-70'
          : isGoogle
            ? 'bg-blue-500/10 border-blue-500/25 hover:border-blue-500/40'
            : 'bg-purple-500/10 border-purple-500/25 hover:border-purple-500/40'
      }`}>
        {/* Provider dot */}
        <div className="pt-0.5 shrink-0">
          <div className={`w-2.5 h-2.5 rounded-full mt-1 ${
            isPast ? 'bg-n-500' : isGoogle ? 'bg-blue-400' : 'bg-purple-400'
          }`} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Title + badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-n-50 truncate">{m.title}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
              isPast
                ? 'bg-n-700 text-n-400'
                : isGoogle
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'bg-purple-500/20 text-purple-300'
            }`}>
              {m.provider === 'google' ? 'Google Meet' : 'Zoom'}
            </span>
            {!isPast && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-green-500/15 text-green-400 uppercase">
                Upcoming
              </span>
            )}
          </div>

          {/* Date + time */}
          <div className="flex items-center gap-1.5 mt-1 text-xs text-n-300">
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {toLocalDate(m.start_time)} · {toLocalTime(m.start_time)} – {toLocalTime(m.end_time)}
          </div>

          {/* Agent */}
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-n-400">
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Booked by <span className="text-n-200 font-semibold ml-0.5">{m.agent_name}</span>
          </div>

          {/* Actions */}
          <div className="mt-2 flex items-center gap-3">
            {m.meeting_link && !isPast && m.status !== 'cancelled' && (
              <a
                href={m.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 text-[11px] font-semibold hover:underline ${
                  isGoogle ? 'text-blue-400' : 'text-purple-400'
                }`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Join meeting
              </a>
            )}
            
            {!isPast && m.status !== 'cancelled' && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!confirm("Are you sure you want to cancel this meeting?")) return;
                  try {
                    const res = await fetch(`${API_BASE}/api/v1/meetings/${m.id}/cancel`, {
                      method: 'PATCH',
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    if (res.ok) {
                      fetchMeetings();
                    } else {
                      const err = await res.json();
                      alert(err.error || "Failed to cancel meeting");
                    }
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="text-[11px] font-semibold text-red-400 hover:text-red-300 hover:underline flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
            )}

            {isPast && m.meeting_link && (
              <span className="text-[11px] text-n-400 flex items-center gap-1 italic">
                Recording/Link (Past)
              </span>
            )}
            
            {m.status === 'cancelled' && (
              <span className="text-[11px] text-red-500/80 font-bold uppercase tracking-wider flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Cancelled
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {upcoming.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-black uppercase tracking-wider text-n-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Upcoming ({upcoming.length})
          </h5>
          {upcoming.map(m => <MeetingCard key={m.id} m={m} />)}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-black uppercase tracking-wider text-n-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-n-500" />
            Past ({past.length})
          </h5>
          {past.map(m => <MeetingCard key={m.id} m={m} />)}
        </div>
      )}
    </div>
  );
}
