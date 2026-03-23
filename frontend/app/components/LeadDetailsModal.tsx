'use client'

import { Lead } from '../types';
import InteractionLog from './InteractionLog';
import TaskManager from './TaskManager';
import LeadFieldsView from './LeadFieldsView';

interface LeadDetailsModalProps {
  lead: Lead;
  token: string;
  onClose: () => void;
  onUpdate: () => void;
  notify: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const STATUS_STYLES: Record<string, string> = {
  New:       'badge-blue',
  Contacted: 'badge-yellow',
  Qualified: 'badge-purple',
  Active:    'badge-green',
  Lost:      'badge-red',
};

export default function LeadDetailsModal({ lead, token, onClose, onUpdate, notify }: LeadDetailsModalProps) {
  const initials = lead.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-4 p-6 border-b border-n-500/60 shrink-0">
          <div className="w-12 h-12 rounded-xl bg-accent-500/15 border border-accent-500/30 flex items-center justify-center text-accent-400 font-black text-base shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-bold text-n-50">{lead.name}</h2>
              <span className={STATUS_STYLES[lead.status] || 'badge-blue'}>{lead.status}</span>
            </div>
            <div className="flex items-center gap-4 mt-1.5 text-sm text-n-400 flex-wrap">
              <a href={`mailto:${lead.email}`} className="hover:text-accent-400 transition-colors flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {lead.email}
              </a>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {lead.phone}
              </span>
              <span className="text-n-500 text-xs">
                #{lead.id} · Added {lead.created_at ? new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <LeadFieldsView lead={lead} token={token} onUpdate={onUpdate} notify={notify} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4 border-t border-n-500/40">
            <InteractionLog leadId={lead.id} token={token} />
            <TaskManager leadId={lead.id} token={token} />
          </div>
        </div>
      </div>
    </div>
  );
}
