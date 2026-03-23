'use client'

import { useState, useEffect } from 'react';
import { API_BASE } from '../config';

interface APIKey {
  id: number;
  key: string;
  name: string;
  created_at: string;
}

interface APIKeyManagementProps {
  token: string;
}

export default function APIKeyManagement({ token }: APIKeyManagementProps) {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [newName, setNewName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState<number | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    const res = await fetch(`${API_BASE}/api/v1/api-keys`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setKeys(await res.json());
  };

  const createKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`${API_BASE}/api/v1/api-keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name: newName })
    });
    if (res.ok) {
      setNewName('');
      setShowForm(false);
      fetchKeys();
    }
    setLoading(false);
  };

  const deleteKey = async (id: number) => {
    if (!confirm('Are you sure? Any external integration using this key will break.')) return;
    const res = await fetch(`${API_BASE}/api/v1/api-keys/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) fetchKeys();
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(id);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-n-50">External API Keys</h2>
          <p className="text-xs text-n-400 mt-0.5">Use these keys to add leads from external web forms or integrations.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-xs py-1.5 px-3 h-8 gap-2">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          New Key
        </button>
      </div>

      {/* Keys list */}
      <div className="space-y-3">
        {keys.map(k => (
          <div key={k.id} className="card p-4 flex items-center gap-4 group hover:border-n-400 transition-all">
            <div className="w-9 h-9 rounded-lg bg-accent-500/15 border border-accent-500/30 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-n-100">{k.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-xs text-accent-400 bg-accent-500/10 px-2 py-0.5 rounded font-mono truncate max-w-xs">{k.key}</code>
                <button onClick={() => copyToClipboard(k.key, k.id)} className="btn-ghost p-1 h-6 w-6 shrink-0">
                  {copySuccess === k.id ? (
                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-n-500 mt-1">Created {new Date(k.created_at).toLocaleDateString()}</p>
            </div>
            <button onClick={() => deleteKey(k.id)} className="btn-ghost p-2 text-n-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        ))}

        {keys.length === 0 && !showForm && (
          <div className="card p-16 text-center text-n-500 text-sm border-dashed">
            No active API keys. Generate one to start receiving external leads.
          </div>
        )}
      </div>

      {/* Usage guide */}
      <div className="card p-4 bg-accent-500/5 border-accent-500/20">
        <p className="section-title text-accent-400 mb-2">API Usage</p>
        <p className="text-xs text-n-300 leading-relaxed">
          Send a <code className="px-1 py-0.5 bg-n-900 rounded text-accent-400">POST</code> to{' '}
          <code className="px-1 py-0.5 bg-n-900 rounded text-accent-400">/api/v1/public/leads</code> with header{' '}
          <code className="px-1 py-0.5 bg-n-900 rounded text-accent-400">X-API-Key: YOUR_KEY</code>
        </p>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-panel w-full max-w-sm p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-n-50">Generate API Key</h3>
              <button onClick={() => setShowForm(false)} className="btn-ghost p-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={createKey} className="space-y-4">
              <div>
                <label className="input-label">Key Name</label>
                <input type="text" required placeholder="e.g. Website Home Form" className="input-field" value={newName} onChange={e => setNewName(e.target.value)} autoFocus />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Generating...' : 'Generate Secret Key'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
