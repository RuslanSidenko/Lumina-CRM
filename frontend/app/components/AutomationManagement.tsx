'use client'

import { useState, useEffect } from 'react';
import { API_BASE } from '../config';

interface AutomationManagementProps {
  token: string;
}

interface Role {
  id: number;
  role_name: string;
}

export default function AutomationManagement({ token }: AutomationManagementProps) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([fetchSettings(), fetchRoles()]).finally(() => {
      setLoading(false);
    });
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/automation/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSettings(await res.json());
      }
    } catch (e) { console.error(e); }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data: any[] = await res.json();
        const uniqueRoles = Array.from(new Set(data.map(r => r.role_name)));
        setRoles(uniqueRoles);
      }
    } catch (e) { console.error(e); }
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
        setSettings(prev => ({...prev, [key]: value}));
        setMessage('Settings saved!');
        setTimeout(() => setMessage(''), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleRole = (resource: 'lead' | 'deal', role: string) => {
    const key = `${resource}_assignment_roles`;
    const currentRoles = settings[key] ? settings[key].split(',') : [];
    let newRoles;
    if (currentRoles.includes(role)) {
      newRoles = currentRoles.filter(r => r !== role);
    } else {
      newRoles = [...currentRoles, role];
    }
    updateSetting(key, newRoles.join(','));
  };

  const algorithms = [
    { id: 'off', name: 'Disabled', desc: 'No automatic assignment' },
    { id: 'round_robin', name: 'Round Robin', desc: 'Assigns in sequence to eligible members' },
    { id: 'least_loaded', name: 'Least Loaded', desc: 'Assigns to members with fewest active items' }
  ];

  if (loading) return <div className="p-8 text-center text-n-200">Loading automation settings...</div>;

  const prioritizeActive = settings['prioritize_active_users'] === 'true';

  const AutomationSection = ({ type, title, desc, icon }: { type: 'lead' | 'deal', title: string, desc: string, icon: React.ReactNode }) => {
    const currentAlgo = settings[`${type}_assignment_algorithm`] || 'off';
    const currentRoles = settings[`${type}_assignment_roles`]?.split(',') || [];

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-accent-500/15 border border-accent-500/30 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div>
            <h2 className="text-lg font-bold text-n-50">{title}</h2>
            <p className="text-xs text-n-300">{desc}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {algorithms.map((algo) => (
            <button
              key={algo.id}
              onClick={() => updateSetting(`${type}_assignment_algorithm`, algo.id)}
              disabled={saving}
              className={`text-left p-4 rounded-xl border transition-all duration-300 relative overflow-hidden group ${
                currentAlgo === algo.id 
                  ? 'bg-accent-500/10 border-accent-500/40 ring-1 ring-accent-500/20' 
                  : 'bg-white/5 border-white/5 hover:border-white/10'
              }`}
            >
              <h3 className={`text-sm font-bold transition-colors ${currentAlgo === algo.id ? 'text-accent-400' : 'text-n-50'}`}>
                {algo.name}
              </h3>
              <p className="text-[10px] text-n-400 mt-1 leading-relaxed opacity-80 group-hover:opacity-100 italic">
                {algo.desc}
              </p>
            </button>
          ))}
        </div>

        {currentAlgo !== 'off' && (
          <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-n-100 uppercase tracking-widest">Eligible Roles</h4>
              <span className="text-[10px] text-n-400 italic">Only users with selected roles will receive assignments</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {roles.map(role => {
                const isSelected = currentRoles.includes(role);
                return (
                  <button
                    key={role}
                    onClick={() => toggleRole(type, role)}
                    disabled={saving}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                      isSelected 
                        ? 'bg-accent-500 text-white border-accent-400 shadow-lg shadow-accent-500/20' 
                        : 'bg-n-600 text-n-200 border-n-500 hover:border-n-400'
                    }`}
                  >
                    {role}
                  </button>
                )
              })}
              {roles.length === 0 && <p className="text-xs text-n-400">No roles found.</p>}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-slide-up space-y-10 pb-10">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-black text-n-50 tracking-tight">Automation Control</h1>
           <p className="text-sm text-n-300">Set up rules for auto-assignment of incoming data</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-2xl p-4 px-6">
           <div className="text-right">
              <p className="text-xs font-bold text-n-50">Filter Active Only</p>
              <p className="text-[10px] text-n-400">Assignment only to users active in last 24h</p>
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

      <AutomationSection 
        type="lead" 
        title="Lead Distribution" 
        desc="Control which agents get assigned new incoming leads"
        icon={<svg className="w-5 h-5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
      />

      <div className="h-px bg-white/5" />

      <AutomationSection 
        type="deal" 
        title="Deal Assignment" 
        desc="Configure automatic ownership for new deal opportunities"
        icon={<svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
      />

      <div className="glass-panel p-6 border-white/5 mt-10">
        <div className="flex items-center justify-between">
           <div>
              <h3 className="text-xs font-bold text-n-100 uppercase tracking-widest mb-1">Background Processing</h3>
              <p className="text-[10px] text-n-400">System workers poll for unassigned records every 5 minutes</p>
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
