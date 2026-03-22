'use client'

import { useState } from 'react';
import { Lead, Property } from '../types';

interface AddDealModalProps {
  token: string;
  leads: Lead[];
  properties: Property[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddDealModal({ token, leads, properties, onClose, onSuccess }: AddDealModalProps) {
  const [form, setForm] = useState({
    lead_id: leads[0]?.id || 0,
    property_id: properties[0]?.id || 0,
    price: 0,
    status: 'Offer' as const,
    close_date: new Date().toISOString().split('T')[0]
  });

  const canSubmit = form.lead_id > 0 && form.property_id > 0 && form.price > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      close_date: form.close_date ? new Date(form.close_date).toISOString() : null
    };

    const res = await fetch('http://localhost:8080/api/v1/deals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    if (res.ok) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-bg/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-md p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
        <h2 className="text-2xl font-bold mb-6">Initialize New Deal</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
           <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Prospective Lead</label>
              <select 
                className="input-field" 
                value={form.lead_id} 
                onChange={e => setForm({...form, lead_id: parseInt(e.target.value)})}
              >
                 {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
           </div>

           <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Target Property</label>
              <select 
                className="input-field" 
                value={form.property_id} 
                onChange={e => setForm({...form, property_id: parseInt(e.target.value)})}
              >
                 {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
           </div>

           <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Deal Value ($)</label>
              <input type="number" required className="input-field" value={form.price} onChange={e => setForm({...form, price: parseInt(e.target.value)})} />
           </div>

           <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Current Stage</label>
              <select className="input-field" value={form.status} onChange={e => setForm({...form, status: e.target.value as any})}>
                 <option value="Offer">Initial Offer</option>
                 <option value="Under Contract">Under Contract</option>
                 <option value="Escrow">In Escrow</option>
                 <option value="Closed">Closed / Won</option>
                 <option value="Lost">Lost</option>
              </select>
           </div>

           <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Expected Closing Date</label>
              <input type="date" className="input-field" value={form.close_date} onChange={e => setForm({...form, close_date: e.target.value})} />
           </div>

            <button 
              type="submit" 
              disabled={!canSubmit}
              className={`btn-primary py-4 mt-2 ${!canSubmit ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
            >
              {canSubmit ? 'Create Deal Record' : 'Assign Lead & Property first'}
            </button>
         </form>
      </div>
    </div>
  );
}
