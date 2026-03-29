'use client'

import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';

interface MeetingBookingProps {
  leadId: number;
  token: string;
  onSuccess: () => void;
  notify: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export default function MeetingBooking({ leadId, token, onSuccess, notify }: MeetingBookingProps) {
  const [connections, setConnections] = useState<string[]>([]);
  const [provider, setProvider] = useState<'google' | 'zoom' | ''>('');
  const [startTime, setStartTime] = useState(new Date(Date.now() + 3600000).toISOString().slice(0, 16));
  const [duration, setDuration] = useState(30);
  const [title, setTitle] = useState('Consultation Meeting');
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);

  useEffect(() => {
    fetchConnections();
  }, [token]);

  const fetchConnections = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/meetings/connections`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConnections(data);
        if (data.includes('google')) setProvider('google');
        else if (data.includes('zoom')) setProvider('zoom');
      }
    } catch (e) { console.error(e); }
    finally { setInitLoading(false); }
  };

  const handleBook = async () => {
    if (!provider) return notify("Select a meeting provider", "warning");

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/meetings/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          lead_id: leadId,
          provider,
          start_time: new Date(startTime).toISOString(),
          duration_minutes: duration,
          title
        })
      });

      if (res.ok) {
        const data = await res.json();
        notify("Meeting booked successfully!", "success");
        onSuccess();
      } else {
        const err = await res.json();
        notify(err.error || "Failed to book meeting", "error");
      }
    } catch (e) {
      notify("An unexpected error occurred", "error");
    } finally {
      setLoading(false);
    }
  };

  if (initLoading) return <div className="text-n-400 text-sm">Checking connections...</div>;

  if (connections.length === 0) {
    return (
      <div className="card-border p-4 bg-n-800/40 text-center">
        <p className="text-sm text-n-400">No meeting services connected.</p>
        <p className="text-xs text-n-500 mt-1">Visit settings to connect Google Meet or Zoom.</p>
      </div>
    );
  }

  return (
    <div className="card-border p-4 bg-n-800/20 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-n-100 flex items-center gap-2">
          <svg className="w-4 h-4 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Schedule Meeting
        </h4>
        <div className="flex gap-1">
          {connections.map(c => (
            <button
              key={c}
              onClick={() => setProvider(c as any)}
              className={`px-2 py-1 text-[10px] uppercase tracking-wider font-bold rounded border transition-all ${
                provider === c 
                  ? 'bg-accent-500 border-accent-500 text-n-900' 
                  : 'bg-n-800 border-n-500/30 text-n-400 hover:border-n-400'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="input-label">Title</label>
          <input 
            type="text" 
            className="input-field py-1.5 text-sm" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="input-label">Date & Time</label>
            <input 
              type="datetime-local" 
              className="input-field py-1.5 text-sm" 
              value={startTime} 
              onChange={e => setStartTime(e.target.value)} 
            />
          </div>
          <div>
            <label className="input-label">Duration (min)</label>
            <select 
              className="input-field py-1.5 text-sm"
              value={duration}
              onChange={e => setDuration(parseInt(e.target.value))}
            >
              <option value={15}>15m</option>
              <option value={30}>30m</option>
              <option value={45}>45m</option>
              <option value={60}>60m</option>
              <option value={90}>90m</option>
            </select>
          </div>
        </div>
      </div>

      <button 
        onClick={handleBook}
        disabled={loading}
        className="btn-accent w-full py-2 text-xs font-bold gap-2"
      >
        {loading ? (
          <span className="flex items-center gap-2 animate-pulse">Booking...</span>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Schedule {provider === 'google' ? 'Google Meet' : 'Zoom Meeting'}
          </>
        )}
      </button>
    </div>
  );
}
