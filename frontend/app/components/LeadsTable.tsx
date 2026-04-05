import { useState, useRef, useEffect } from 'react';
import { Lead } from '../types';
import { API_BASE } from '../config';

interface LeadsTableProps {
  leads: Lead[];
  token: string;
  role: string;
  users: any[];
  customFieldDefs: any[];
  refreshData: () => void;
  onLeadClick: (lead: Lead) => void;
  onFilterChange: (filters: any) => void;
  notify: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const STATUS_LIST = [
  { value: 'New', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'Contacted', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { value: 'Qualified', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { value: 'Active', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { value: 'Lost', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { value: 'Not Interested', color: 'bg-red-900/20 text-red-300 border-red-900/30' },
  { value: 'Ignored', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
];

const STATUS_STYLES: Record<string, string> = {
  New: 'badge-blue',
  Contacted: 'badge-yellow',
  Qualified: 'badge-purple',
  Active: 'badge-green',
  Lost: 'badge-red',
  'Not Interested': 'badge-red',
  Ignored: 'badge-gray',
};

export default function LeadsTable({ leads, token, role, users, customFieldDefs, refreshData, onLeadClick, onFilterChange, notify }: LeadsTableProps) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'name' | 'status' | 'created_at'>('created_at');
  const [showFilters, setShowFilters] = useState(false);
  
  // Advanced Filter state
  const [filters, setFilters] = useState<any>({
    status: [] as string[],
    exclude_status: false,
    unassigned_only: false,
    assigned_to: '',
    created_by: '',
    source: '',
    start_date: '',
    end_date: '',
    // Custom field filters stored as { cf_LABEL: value }
  });

  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };
    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilters]);

  const deleteLead = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this lead?')) return;
    const res = await fetch(`${API_BASE}/api/v1/leads/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
        refreshData();
        notify("Lead deleted successfully", "success");
    } else {
        const err = await res.json().catch(() => ({}));
        notify(err.error || "Failed to delete lead.", "error");
    }
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    onFilterChange({ ...filters, search: val });
  };

  const setStatusFilter = (val: string) => {
    const next = filters.status.includes(val) 
      ? filters.status.filter((s: string) => s !== val) 
      : [...filters.status, val];
    setFilters({ ...filters, status: next });
  };

  const handleCustomFieldFilter = (label: string, value: string) => {
     setFilters({ ...filters, [`cf_${label}`]: value });
  };

  const applyFilters = () => {
    onFilterChange({ ...filters, search });
    setShowFilters(false);
  };

  const clearFilters = () => {
    const empty: any = { status: [], exclude_status: false, unassigned_only: false, assigned_to: '', created_by: '', source: '', start_date: '', end_date: '' };
    setFilters(empty);
    onFilterChange({ ...empty, search });
    setShowFilters(false);
  };

  const hasActiveFilters = filters.status.length > 0 || filters.unassigned_only || filters.assigned_to || filters.created_by || filters.source || filters.start_date || filters.end_date || Object.keys(filters).some(k => k.startsWith('cf_') && filters[k]);

  const filtered = [...leads].sort((a, b) => {
    if (sortKey === 'name') return a.name.localeCompare(b.name);
    if (sortKey === 'status') return a.status.localeCompare(b.status);
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });

  const initials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const AVATAR_COLORS = [
    'bg-accent-500/20 text-accent-400',
    'bg-emerald-500/20 text-emerald-400',
    'bg-violet-500/20 text-violet-400'
  ];

  return (
    <div className="relative">
      <div className="flex items-center gap-4 px-6 py-4 border-b border-n-500/60 bg-n-900/10">
        <div className="relative group flex-1 max-w-sm">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-n-400 group-focus-within:text-accent-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search name, phone, email, source..."
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            className="bg-n-800 border border-n-500 text-n-100 text-sm rounded-lg pl-9 pr-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-accent-500 transition-all border-transparent hover:border-n-500 placeholder-n-500"
          />
        </div>

        <div className="relative" ref={filterRef}>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
              showFilters || hasActiveFilters 
              ? 'bg-accent-500/10 border-accent-500/30 text-accent-400' 
              : 'bg-n-800 border-n-600 text-n-300 hover:border-n-400'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Advanced Filter
            {hasActiveFilters && <span className="flex items-center justify-center w-4 h-4 bg-accent-500 text-white rounded-full text-[9px] -mr-1">!</span>}
          </button>

          {showFilters && (
            <div className="absolute top-full right-0 mt-3 w-[450px] bg-n-900 border border-n-500/60 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl z-[100] p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[70vh]">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-black uppercase text-n-400 tracking-widest">Advanced Filtering</h4>
                <button onClick={clearFilters} className="text-[10px] font-bold text-accent-400 hover:text-accent-300">Clear All</button>
              </div>

              {/* Status */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-n-100">Filter by Status</label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                     <span className="text-[10px] text-n-400 font-medium group-hover:text-n-300">Exclude selected</span>
                     <input type="checkbox" className="hidden" checked={filters.exclude_status} onChange={() => setFilters({...filters, exclude_status: !filters.exclude_status})} />
                     <div className={`w-7 h-4 rounded-full transition-colors relative ${filters.exclude_status ? 'bg-red-500/50' : 'bg-n-700'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${filters.exclude_status ? 'left-[14px]' : 'left-0.5'}`} />
                     </div>
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {STATUS_LIST.map(s => (
                    <button key={s.value} onClick={() => setStatusFilter(s.value)} className={`text-[10px] font-bold px-3 py-1.5 rounded-md border transition-all ${filters.status.includes(s.value) ? s.color + ' ring-1' : 'bg-n-800 text-n-400 border-transparent hover:border-n-600'}`}>{s.value}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-n-100">Assignee</label>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-3 p-2 bg-n-800 rounded-lg cursor-pointer hover:bg-n-700 transition-colors">
                      <input type="checkbox" className="accent-accent-500 h-4 w-4 rounded" checked={filters.unassigned_only} onChange={() => setFilters({ ...filters, unassigned_only: !filters.unassigned_only, assigned_to: '' })} />
                      <span className="text-[11px] font-semibold text-n-200">Unassigned Only</span>
                    </label>
                    {!filters.unassigned_only && (
                      <select className="input-field bg-n-800 py-1.5 text-[11px] h-9" value={filters.assigned_to} onChange={e => setFilters({...filters, assigned_to: e.target.value})}>
                        <option value="">Specific Lead Manager</option>
                        {users.map(u => (<option key={u.id} value={u.id}>{u.name}</option>))}
                      </select>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-n-100">Creator</label>
                  <select className="input-field bg-n-800 py-1.5 text-[11px] h-9" value={filters.created_by} onChange={e => setFilters({...filters, created_by: e.target.value})}>
                    <option value="">Created By (Agent)</option>
                    {users.map(u => (<option key={u.id} value={u.id}>{u.name}</option>))}
                  </select>
                </div>
              </div>

              {/* Custom Fields */}
              {customFieldDefs.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-n-500/20">
                  <label className="text-xs font-bold text-n-100 uppercase tracking-tight text-accent-500/70">Custom Field Filters</label>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    {customFieldDefs.map(field => (
                      <div key={field.id} className="space-y-1">
                        <label className="text-[10px] font-bold text-n-400">{field.label}</label>
                        {field.field_type === 'select' ? (
                          <select className="input-field bg-n-800 py-1 text-[11px] h-8" value={filters[`cf_${field.label}`] || ''} onChange={e => handleCustomFieldFilter(field.label, e.target.value)}>
                            <option value="">Select {field.label}</option>
                            {(field.options || []).map((o:string) => (<option key={o} value={o}>{o}</option>))}
                          </select>
                        ) : (
                          <input type={field.field_type === 'number' ? 'number' : 'text'} className="input-field bg-n-800 py-1 text-[11px] h-8" placeholder={`Filter ${field.label}...`} value={filters[`cf_${field.label}`] || ''} onChange={e => handleCustomFieldFilter(field.label, e.target.value)} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-n-500/20">
                <label className="text-xs font-bold text-n-100">Date Added Range</label>
                <div className="flex items-center gap-2">
                  <input type="date" className="input-field flex-1 bg-n-800 py-1.5 text-[10px] h-9 px-2" value={filters.start_date} onChange={e => setFilters({...filters, start_date: e.target.value})} />
                  <span className="text-n-600">—</span>
                  <input type="date" className="input-field flex-1 bg-n-800 py-1.5 text-[10px] h-9 px-2" value={filters.end_date} onChange={e => setFilters({...filters, end_date: e.target.value})} />
                </div>
              </div>

              <button onClick={applyFilters} className="w-full btn-primary py-3 text-[11px] font-black uppercase tracking-widest shadow-xl shadow-accent-600/20">Apply Filters</button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto shrink-0 bg-n-800 p-1 rounded-lg border border-n-500/20">
          <select value={sortKey} onChange={e => setSortKey(e.target.value as any)} className="bg-transparent text-n-200 text-[10px] font-bold px-2 py-1 focus:outline-none cursor-pointer">
            <option value="created_at">RECENT FIRST</option>
            <option value="name">NAME (A-Z)</option>
            <option value="status">BY STATUS</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-n-500/20 bg-n-900/5">
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-n-500">Contact</th>
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-n-500">Messaging</th>
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-n-500">Status & Source</th>
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-n-500">Assignment</th>
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-n-500">Timeline</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-n-500/10">
            {filtered.map((lead, i) => (
              <tr key={lead.id} onClick={() => onLeadClick(lead)} className="hover:bg-accent-500/[0.02] transition-all duration-100 cursor-pointer group border-l-2 border-transparent hover:border-accent-500">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-black shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>{initials(lead.name)}</div>
                    <div>
                      <div className="font-bold text-n-50 group-hover:text-accent-400 transition-colors">{lead.name}</div>
                      <div className="text-[9px] text-n-500 font-black uppercase tracking-widest mt-0.5 whitespace-nowrap">ID: #{lead.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                   <div className="space-y-0.5">
                      <div className="text-n-200 text-xs flex items-center gap-2">{lead.email || <span className="text-n-600">No email</span>}</div>
                      <div className="text-n-400 text-[11px] font-mono">{lead.phone}</div>
                   </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1.5 items-start">
                    <span className={STATUS_STYLES[lead.status] || 'badge-blue'}>{lead.status}</span>
                    <span className="text-[10px] font-bold text-n-500 uppercase tracking-tighter bg-n-800 px-1.5 py-0.5 rounded border border-n-700">{lead.source || 'Direct'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col space-y-1">
                    <div className="text-xs text-n-100 font-medium">
                      {users.find(u => u.id === lead.assigned_to)?.name || <span className="text-n-500 italic">Unassigned</span>}
                    </div>
                    <div className="text-[9px] text-n-500 font-bold uppercase">Creator: {users.find(u => u.id === lead.created_by)?.name || 'System'}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs font-bold text-n-300">
                   {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '—'}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                    {role === 'admin' && (
                      <button onClick={e => deleteLead(lead.id, e)} className="p-2 text-red-500/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {leads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-n-400 space-y-4">
            <svg className="w-12 h-12 text-n-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-sm">No records found matching filters.</span>
            <button onClick={clearFilters} className="text-xs font-bold text-accent-400 hover:underline">Clear Filters</button>
          </div>
        )}
      </div>
    </div>
  );
}
