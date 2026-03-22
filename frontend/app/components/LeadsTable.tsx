import { useState } from 'react';
import { Lead } from '../types';

interface LeadsTableProps {
  leads: Lead[];
  token: string;
  role: string;
  refreshData: () => void;
  onLeadClick: (lead: Lead) => void;
}

export default function LeadsTable({ leads, token, role, refreshData, onLeadClick }: LeadsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const deleteLead = async (id: number) => {
    if (!confirm(`Delete lead ${id}? This action requires Admin privileges.`)) return;
    
    const res = await fetch(`http://localhost:8080/api/v1/leads/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (res.ok) {
      refreshData();
    } else {
      const errorData = await res.json().catch(()=>({}));
      alert("Failed to delete lead: " + (errorData.error || "Must be an admin."));
    }
  };

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.phone.includes(searchTerm)
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-md">
           <input 
            type="text" 
            placeholder="Search leads..." 
            className="input-field pl-10 h-10 text-sm" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
           />
           <svg className="w-4 h-4 absolute left-3 top-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
      </div>

      <div className="glass-panel overflow-hidden border border-dark-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-400 bg-slate-800/30 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {filteredLeads.map(lead => (
                <tr 
                  key={lead.id} 
                  onClick={() => onLeadClick(lead)}
                  className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4 font-medium text-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
                        {lead.name.charAt(0)}
                      </div>
                      {lead.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-200">{lead.email}</div>
                    <div className="text-slate-500 text-xs mt-1">{lead.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                      lead.status === 'New' 
                        ? 'bg-brand-500/10 text-brand-400 border-brand-500/20' 
                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex gap-3 justify-end items-center h-full">
                    <a 
                      href={`mailto:${lead.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors"
                    >
                      Email
                    </a>
                    {role === 'admin' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteLead(lead.id); }} 
                        className="text-sm font-medium text-red-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {filteredLeads.length === 0 && (
         <div className="p-12 text-center text-slate-500">No leads match your search criteria.</div>
      )}
    </div>
  );
}
