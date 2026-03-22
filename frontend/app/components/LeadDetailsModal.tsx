'use client'

import { Lead } from '../types';
import InteractionLog from './InteractionLog';
import TaskManager from './TaskManager';

interface LeadDetailsModalProps {
  lead: Lead;
  token: string;
  onClose: () => void;
}

export default function LeadDetailsModal({ lead, token, onClose }: LeadDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-bg/80 backdrop-blur-sm transition-all duration-300">
      <div 
        className="glass-panel w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 relative" 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <header className="p-8 border-b border-dark-border bg-white/5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white mb-2">{lead.name}</h2>
              <div className="flex gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1.5">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                   {lead.email}
                </span>
                <span className="flex items-center gap-1.5">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                   {lead.phone}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                lead.status === 'New' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                lead.status === 'Contacted' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                'bg-green-500/20 text-green-400 border border-green-500/30'
              }`}>
                {lead.status}
              </span>
              <p className="text-[10px] text-slate-500 mt-2">ID: #{lead.id} • Registered {new Date(lead.created_at || '').toLocaleDateString()}</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
          <InteractionLog leadId={lead.id} token={token} />
          <TaskManager leadId={lead.id} token={token} />
        </div>
      </div>
    </div>
  );
}
