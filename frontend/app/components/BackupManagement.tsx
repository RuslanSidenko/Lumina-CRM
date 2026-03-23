'use client'

import { useState } from 'react';
import { API_BASE } from '../config';

interface BackupManagementProps {
  token: string;
}

export default function BackupManagement({ token }: BackupManagementProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const triggerBackup = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    
    try {
      const res = await fetch(`${API_BASE}/api/v1/backups/trigger`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
      } else {
        setError(data.error || 'Backup failed');
      }
    } catch (err) {
      setError('Connection error. Check your database and S3 configuration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-slide-up space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent-500/15 border border-accent-500/30 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V7M4 7c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2M4 7l8 5 8-5M12 11l-4-4m4 4l4-4" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-n-50">Database Backups</h2>
          <p className="text-xs text-n-400">Manage snapshots and cloud storage</p>
        </div>
      </div>

      <div className="card p-8 text-center space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-4H8l4-4 4 4h-3v4h-2z"/></svg>
        </div>

        <div className="max-w-xs mx-auto space-y-4 relative z-10">
          <p className="text-sm text-n-300 leading-relaxed">
            Generate a full database dump and upload it securely to your configured S3 bucket.
            <span className="block mt-2 text-[10px] text-n-500 italic">Automatic backups occur daily at server startup time.</span>
          </p>
          
          <button 
            onClick={triggerBackup}
            disabled={loading}
            className="btn-primary w-full py-3 font-bold shadow-lg shadow-accent-500/20 flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1h16v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Trigger Manual Backup
              </>
            )}
          </button>
        </div>

        {message && (
          <div className="max-w-md mx-auto p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center justify-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            {message}
          </div>
        )}

        {error && (
          <div className="max-w-md mx-auto p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3 text-left">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div>
               <p className="font-bold mb-1">Backup Error</p>
               <p className="text-xs opacity-80">{error}</p>
            </div>
          </div>
        )}
      </div>

      <div className="glass-panel p-6 border-white/5">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Configuration Status</h3>
        <div className="grid grid-cols-2 gap-4">
           <div className="p-3 rounded-lg bg-white/5 flex items-center justify-between">
              <span className="text-xs text-slate-400">S3 Storage</span>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                 <span className="text-[10px] font-bold text-slate-300 uppercase underline decoration-emerald-500/30">Active</span>
              </div>
           </div>
           <div className="p-3 rounded-lg bg-white/5 flex items-center justify-between">
              <span className="text-xs text-slate-400">Daily Schedule</span>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                 <span className="text-[10px] font-bold text-slate-300 uppercase underline decoration-blue-500/30">Enabled</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
