import { useState } from 'react';
import { Lead } from '../types';
import { API_BASE } from '../config';

interface LeadsTableProps {
  leads: Lead[];
  token: string;
  role: string;
  refreshData: () => void;
  onLeadClick: (lead: Lead) => void;
}

const STATUS_STYLES: Record<string, string> = {
  New: 'badge-blue',
  Contacted: 'badge-yellow',
  Qualified: 'badge-purple',
  Active: 'badge-green',
  Lost: 'badge-red',
};

export default function LeadsTable({ leads, token, role, refreshData, onLeadClick }: LeadsTableProps) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'name' | 'status' | 'created_at'>('created_at');

  const deleteLead = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this lead? This cannot be undone.')) return;
    const res = await fetch(`${API_BASE}/api/v1/leads/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) refreshData();
    else alert('Failed to delete lead. Admin privileges required.');
  };

  const filtered = leads
    .filter(l =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search)
    )
    .sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name);
      if (sortKey === 'status') return a.status.localeCompare(b.status);
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

  const initials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const AVATAR_COLORS = [
    'bg-accent-500/20 text-accent-400',
    'bg-emerald-500/20 text-emerald-400',
    'bg-violet-500/20 text-violet-400',
    'bg-sky-500/20 text-sky-400',
    'bg-amber-500/20 text-amber-400',
  ];

  return (
    <div>
      {/* Table Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-n-500/60">
        <div className="relative flex-1 max-w-xs">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-n-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Filter leads..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-n-800 border border-n-500 text-n-100 text-sm rounded-lg pl-9 pr-3 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-accent-500 focus:border-accent-500 placeholder-n-400"
          />
        </div>
        <select
          value={sortKey}
          onChange={e => setSortKey(e.target.value as any)}
          className="bg-n-800 border border-n-500 text-n-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent-500"
        >
          <option value="created_at">Sort: Recent</option>
          <option value="name">Sort: Name</option>
          <option value="status">Sort: Status</option>
        </select>
        <span className="text-xs text-n-400 ml-auto shrink-0">{filtered.length} records</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-n-500/60">
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-n-400">Contact</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-n-400">Email</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-n-400">Phone</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-n-400">Status</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-n-400">Added</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-n-500/40">
            {filtered.map((lead, i) => (
              <tr
                key={lead.id}
                onClick={() => onLeadClick(lead)}
                className="hover:bg-n-600/50 transition-colors duration-100 cursor-pointer group"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                      {initials(lead.name)}
                    </div>
                    <span className="font-semibold text-n-50 group-hover:text-accent-400 transition-colors">{lead.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-n-300">{lead.email}</td>
                <td className="px-4 py-3 text-n-300 font-mono text-xs">{lead.phone}</td>
                <td className="px-4 py-3">
                  <span className={STATUS_STYLES[lead.status] || 'badge badge-blue'}>{lead.status}</span>
                </td>
                <td className="px-4 py-3 text-n-400 text-xs">
                  {lead.created_at ? new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                    <a
                      href={`mailto:${lead.email}`}
                      onClick={e => e.stopPropagation()}
                      className="btn-ghost py-1 px-2 text-xs"
                    >
                      Email
                    </a>
                    {role === 'admin' && (
                      <button onClick={e => deleteLead(lead.id, e)} className="btn-ghost py-1 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10">
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-20 text-center text-n-400 text-sm">
            {search ? 'No leads match your filter.' : 'No leads yet. Add your first lead!'}
          </div>
        )}
      </div>
    </div>
  );
}
