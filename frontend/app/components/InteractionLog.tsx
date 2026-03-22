'use client'

import { useState, useEffect } from 'react';
import { Interaction } from '../types';

interface InteractionLogProps {
  leadId: number;
  token: string;
}

export default function InteractionLog({ leadId, token }: InteractionLogProps) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [newInteraction, setNewInteraction] = useState({ type: 'note', content: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInteractions();
  }, [leadId, token]);

  const fetchInteractions = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/v1/interactions?lead_id=${leadId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInteractions(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const submitInteraction = async () => {
    if (!newInteraction.content) return;
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/v1/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          lead_id: leadId,
          type: newInteraction.type,
          content: newInteraction.content
        })
      });
      setLoading(false);
      if (res.ok) {
        setNewInteraction({ ...newInteraction, content: '' });
        fetchInteractions();
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h4 className="text-lg font-semibold">Interaction History</h4>
      
      <div className="flex flex-col gap-2 p-3 bg-dark-bg/50 rounded-lg border border-dark-border">
        <div className="flex gap-2">
          <select 
            value={newInteraction.type}
            onChange={(e) => setNewInteraction({...newInteraction, type: e.target.value as any})}
            className="input-field py-1 text-sm w-32"
          >
            <option value="note">Note</option>
            <option value="call">Call</option>
            <option value="email">Email</option>
            <option value="meeting">Meeting</option>
          </select>
          <input 
            type="text"
            placeholder="Log an activity..."
            className="input-field flex-1 py-1 text-sm"
            value={newInteraction.content}
            onChange={(e) => setNewInteraction({...newInteraction, content: e.target.value})}
            onKeyPress={(e) => e.key === 'Enter' && submitInteraction()}
          />
          <button 
            onClick={submitInteraction}
            disabled={loading}
            className="btn-primary py-1 px-3 text-sm"
          >
            {loading ? '...' : 'Log'}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-2">
        {interactions.map((i) => (
          <div key={i.id} className="p-3 bg-dark-bg/30 rounded-lg border border-dark-border/50 text-sm">
            <div className="flex justify-between items-center mb-1">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                i.type === 'call' ? 'bg-blue-500/20 text-blue-400' :
                i.type === 'email' ? 'bg-purple-500/20 text-purple-400' :
                i.type === 'meeting' ? 'bg-green-500/20 text-green-400' :
                'bg-slate-500/20 text-slate-400'
              }`}>
                {i.type}
              </span>
              <span className="text-slate-500 text-[10px]">
                {new Date(i.created_at).toLocaleString()}
              </span>
            </div>
            <p className="text-slate-300">{i.content}</p>
          </div>
        ))}
        {interactions.length === 0 && (
          <p className="text-center text-slate-500 text-xs py-4">No interactions logged yet.</p>
        )}
      </div>
    </div>
  );
}
