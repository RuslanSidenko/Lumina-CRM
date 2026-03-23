'use client'

import { useState, useEffect } from 'react';
import { API_BASE } from '../config';

interface AutomationManagementProps {
  token: string;
}

export default function AutomationManagement({ token }: AutomationManagementProps) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/automation/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSettings(await res.json());
      }
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    setSaving(true);
    setMessage('');
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
        setSettings({...settings, [key]: value});
        setMessage('Settings saved!');
        setTimeout(() => setMessage(''), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const algorithms = [
    { id: 'off', name: 'Disabled', desc: 'Leads remain unassigned until manually picked' },
    { id: 'round_robin', name: 'Round Robin', desc: 'Assigns leads to eligible members in sequence' },
    { id: 'least_loaded', name: 'Least Loaded', desc: 'Assigns to eligible members with fewest active leads' }
  ];

  if (loading) return <div className="p-8 text-center text-n-400">Loading automation settings...</div>;

  const currentAlgo = settings['lead_assignment_algorithm'] || 'off';
  const prioritizeActive = settings['prioritize_active_users'] === 'true';

  return (
    <div className="animate-slide-up space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-500/15 border border-accent-500/30 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-n-50">Lead Automation</h2>
            <p className="text-xs text-n-400">Configure how incoming leads are distributed</p>
          </div>
        </div>

        {/* New Priority Toggle */}
        <div className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl p-4 px-6">
           <div className="text-right">
              <p className="text-xs font-bold text-n-50">Filter Active Only</p>
              <p className="text-[10px] text-n-400">Prioritize users active in last 24h</p>
           </div>
           <button 
             onClick={() => updateSetting('prioritize_active_users', prioritizeActive ? 'false' : 'true')}
             disabled={saving}
             className={`relative w-11 h-6 transition-colors rounded-full ${prioritizeActive ? 'bg-accent-500' : 'bg-n-600'}`}
           >
             <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${prioritizeActive ? 'translate-x-5' : ''}`} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {algorithms.map((algo) => (
          <button
            key={algo.id}
            onClick={() => updateSetting('lead_assignment_algorithm', algo.id)}
            disabled={saving}
            className={`text-left p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${
              currentAlgo === algo.id 
                ? 'bg-accent-500/10 border-accent-500/40 ring-1 ring-accent-500/20' 
                : 'bg-white/5 border-white/5 hover:border-white/10'
            }`}
          >
            {currentAlgo === algo.id && (
              <div className="absolute top-4 right-4 text-accent-400 animate-in zoom-in duration-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              </div>
            )}
            
            <h3 className={`font-bold transition-colors ${currentAlgo === algo.id ? 'text-accent-400' : 'text-n-50'}`}>
              {algo.name}
            </h3>
            <p className="text-xs text-n-400 mt-2 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
              {algo.desc}
            </p>

            {currentAlgo === algo.id && (
              <div className="mt-4 pt-4 border-t border-accent-500/10 flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse" />
                 <span className="text-[10px] font-bold text-accent-400 uppercase tracking-widest">Active Algorithm</span>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="glass-panel p-6 border-white/5">
        <div className="flex items-center justify-between">
           <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">System Health</h3>
              <p className="text-[10px] text-slate-400">Background workers are polling for unassigned leads every 5 minutes</p>
           </div>
           {message && (
             <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full font-bold border border-emerald-500/20 animate-in fade-in slide-in-from-right-4">
                {message}
             </span>
           )}
        </div>
      </div>
    </div>
  );
}
