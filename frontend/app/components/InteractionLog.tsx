'use client'

import { useState, useEffect } from 'react';
import { Interaction } from '../types';
import { API_BASE } from '../config';
import { useTranslations } from 'next-intl';

interface InteractionLogProps {
  leadId: number;
  token: string;
}

const TYPE_BADGE: Record<string, string> = {
  note: 'badge-blue',
  call: 'badge-green',
  email: 'badge-purple',
  meeting: 'badge-yellow',
};

const TYPE_ICON: Record<string, string> = {
  note: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  call: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  email: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  meeting: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
};

export default function InteractionLog({ leadId, token }: InteractionLogProps) {
  const t = useTranslations('Interactions');
  const tc = useTranslations('Common');
  
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [newItem, setNewItem] = useState({ type: 'note', content: '' });
  const [loading, setLoading] = useState(false);

  const currentLocale = typeof document !== 'undefined' ? (document.cookie.match(/NEXT_LOCALE=([^;]+)/)?.[1] || 'en') : 'en';

  useEffect(() => { fetchInteractions(); }, [leadId]);

  const fetchInteractions = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/interactions?lead_id=${leadId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setInteractions(await res.json());
    } catch (e) { console.error(e); }
  };

  const submit = async () => {
    if (!newItem.content.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lead_id: leadId, ...newItem }),
      });
      if (res.ok) {
        setNewItem({ ...newItem, content: '' });
        fetchInteractions();
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-n-100 flex items-center gap-2">
        <svg className="w-4 h-4 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        {t('title')}
      </h4>

      {/* Input */}
      <div className="flex gap-2 bg-n-900/50 border border-n-500/60 rounded-xl p-3">
        <select
          value={newItem.type}
          onChange={e => setNewItem({ ...newItem, type: e.target.value })}
          className="bg-n-800 border border-n-500/50 text-n-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent-500 shrink-0"
        >
          {['note', 'call', 'email', 'meeting'].map(type => (
            <option key={type} value={type}>{t(type as any)}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder={t('placeholder')}
          value={newItem.content}
          onChange={e => setNewItem({ ...newItem, content: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && submit()}
          className="bg-transparent text-n-100 text-sm flex-1 focus:outline-none placeholder-n-500"
        />
        <button onClick={submit} disabled={loading || !newItem.content.trim()} className="btn-primary text-xs py-1 px-4 h-8 shrink-0">
          {loading ? '...' : t('button')}
        </button>
      </div>

      {/* Timeline */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {interactions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-n-500 space-y-2 opacity-60">
             <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             <p className="text-xs font-bold uppercase tracking-widest">{t('no_activities')}</p>
          </div>
        )}
        {interactions.map(item => (
          <div key={item.id} className="flex gap-3 group">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${TYPE_BADGE[item.type]?.replace('badge', '') || ''} bg-n-800 border border-n-500/20`}>
              <svg className="w-4 h-4 text-n-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={TYPE_ICON[item.type] || TYPE_ICON.note} />
              </svg>
            </div>
            <div className="flex-1 min-w-0 bg-n-800/40 rounded-xl px-4 py-3 border border-n-500/40 group-hover:border-n-400 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border border-current opacity-70 ${TYPE_BADGE[item.type] || 'badge-blue'}`}>{t(item.type as any)}</span>
                <span className="text-[10px] text-n-500 font-medium">
                   {new Date(item.created_at).toLocaleString(currentLocale === 'ru' ? 'ru-RU' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-[13px] text-n-200 leading-relaxed">{item.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
