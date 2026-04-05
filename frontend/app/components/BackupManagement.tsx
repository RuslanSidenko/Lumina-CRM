'use client'

import { useState, useEffect } from 'react';
import { API_BASE } from '../config';
import { useTranslations } from 'next-intl';

interface BackupManagementProps {
  token: string;
  notify: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export default function BackupManagement({ token, notify }: BackupManagementProps) {
  const t = useTranslations('Backups');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ s3_active: false, daily_enabled: false, frequency: '24h', last_status: '', last_time: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/backups/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setStatus(await res.json());
      }
    } catch (e) {
      console.error('Failed to fetch backup status', e);
    }
  };

  const updateBackupSetting = async (key: string, value: string) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/automation/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ key, value })
      });
      if (res.ok) {
        fetchStatus();
        notify(t('updated'));
      } else {
        notify(t('failed'), 'error');
      }
    } finally {
      setSaving(false);
    }
  };

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
        notify(data.message);
      } else {
        notify(data.error || 'Backup failed', 'error');
      }
    } catch (err) {
      notify('Connection error. Check your database and S3 configuration.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-slide-up space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent-500/20 to-accent-600/5 border border-accent-500/20 flex items-center justify-center shadow-inner">
            <svg className="w-6 h-6 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-black text-n-50 tracking-tight">{t('title')}</h2>
            <p className="text-[11px] font-bold text-n-400 uppercase tracking-widest mt-0.5">{t('subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Manual Trigger Card */}
      <div className="relative group overflow-hidden rounded-2xl border border-n-500 bg-gradient-to-b from-n-700 to-n-800 shadow-2xl">
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
          <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
          </svg>
        </div>

        <div className="relative z-10 p-10 flex flex-col items-center text-center">
          <div className="max-w-md space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-n-50">{t('on_demand_title')}</h3>
              <p className="text-sm text-n-300 leading-relaxed font-medium">
                {t('on_demand_desc')}
              </p>
            </div>

            <div className="flex flex-col items-center gap-3">
              <button
                onClick={triggerBackup}
                disabled={loading}
                className="group relative px-8 py-3.5 bg-accent-500 hover:bg-accent-400 text-white rounded-xl font-bold text-sm transition-all duration-300 shadow-xl shadow-accent-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-3"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t('synchronizing')}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 group-hover:-translate-y-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    <span>{t('trigger_button')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>

      <div className="card-hover p-6 border-n-500/50 bg-n-700/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[11px] font-extrabold text-n-300 uppercase tracking-[0.2em]">{t('infrastructure_title')}</h3>
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-n-800/80 border border-n-600/50">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${status.s3_active ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${status.s3_active ? 'text-emerald-400' : 'text-red-400'}`}>
              {status.s3_active ? t('s3_online') : t('s3_offline')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Automation Toggle */}
          <div className="group p-4 rounded-xl bg-n-800/40 border border-n-600/30 hover:border-accent-500/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-n-400 uppercase tracking-wider">{t('automation_engine')}</span>
                <p className="text-xs font-semibold text-n-50">{t('auto_backups')}</p>
              </div>
              <button
                onClick={() => updateBackupSetting('backup_enabled', status.daily_enabled ? 'false' : 'true')}
                disabled={saving}
                className={`relative w-11 h-6 transition-all duration-300 rounded-full flex items-center px-1 ${status.daily_enabled ? 'bg-accent-500' : 'bg-n-600'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${status.daily_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
            <p className="text-[10px] text-n-400 leading-normal">
              {t('backups_desc')}
            </p>
          </div>

          {/* Frequency Control */}
          <div className="p-4 rounded-xl bg-n-800/40 border border-n-600/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-n-400 uppercase tracking-wider text-left">{t('sync_interval')}</span>
              <span className="text-[10px] font-bold text-accent-400 bg-accent-500/10 px-2 py-0.5 rounded border border-accent-500/20">{t('frequency')}</span>
            </div>
            <div className="flex gap-1.5">
              {['1h', '6h', '12h', '24h'].map(f => (
                <button
                  key={f}
                  onClick={() => updateBackupSetting('backup_frequency', f)}
                  disabled={saving}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${(status.frequency || '24h') === f
                      ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/20 scale-[1.02]'
                      : 'bg-n-900/50 text-n-400 border border-n-600/30 hover:bg-n-600/40'
                    }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {status.last_time && (
          <div className="mt-6 pt-6 border-t border-n-500/50">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-n-800/50 to-n-800/30 border border-n-600/20">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${status.last_status === 'success' ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' : 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20'}`}>
                  <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {status.last_status === 'success' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    )}
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-black text-n-400 uppercase tracking-widest flex items-center gap-2">
                    {t('verification')}
                    <span className={`w-1.5 h-1.5 rounded-full ${status.last_status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  </p>
                  <p className="text-[13px] text-n-50 font-semibold mt-0.5">
                    {new Date(status.last_time.split(' | ')[0]).toLocaleDateString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${status.last_status === 'success' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'}`}>
                {status.last_status === 'success' ? t('verified') : status.last_status}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
