'use client'

import { useState, useEffect } from 'react';

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
    const res = await fetch('http://localhost:8080/api/v1/api-keys', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setKeys(await res.json());
  };

  const createKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('http://localhost:8080/api/v1/api-keys', {
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
    const res = await fetch(`http://localhost:8080/api/v1/api-keys/${id}`, {
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
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-xl font-bold">External API Keys</h2>
           <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Use these keys to add leads from external web forms</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="btn-primary py-2 px-4 text-sm"
        >
          Generate New Key
        </button>
      </div>

      <div className="grid gap-4">
        {keys.map(k => (
          <div key={k.id} className="glass-panel p-6 flex justify-between items-center group">
            <div className="flex flex-col gap-1">
               <span className="text-sm font-bold text-slate-200">{k.name}</span>
               <div className="flex items-center gap-2">
                  <code className="text-xs text-brand-400 bg-brand-500/10 px-2 py-1 rounded font-mono">
                    {k.key}
                  </code>
                  <button 
                    onClick={() => copyToClipboard(k.key, k.id)}
                    className="text-slate-500 hover:text-white transition-colors"
                  >
                    {copySuccess === k.id ? (
                      <span className="text-[10px] uppercase font-bold text-green-500">Copied!</span>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                    )}
                  </button>
               </div>
               <span className="text-[10px] text-slate-500 mt-1">Created: {new Date(k.created_at).toLocaleString()}</span>
            </div>
            <button 
              onClick={() => deleteKey(k.id)}
              className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400 p-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        ))}

        {keys.length === 0 && !showForm && (
          <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-2xl text-slate-500 italic">
            No active API keys. Generate one to start receiving external leads.
          </div>
        )}
      </div>

      <div className="glass-panel p-6 bg-brand-500/5 border-brand-500/20">
         <h4 className="text-xs font-bold text-brand-400 uppercase mb-2">How to use</h4>
         <p className="text-xs text-slate-400 leading-relaxed">
            Send a <code className="text-brand-300">POST</code> request to <code className="text-brand-300">/api/v1/public/leads</code> with the header <code className="text-brand-300">X-API-Key: YOUR_KEY</code>.
         </p>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-bg/80 backdrop-blur-sm">
           <div className="glass-panel w-full max-w-md p-8 relative">
              <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
              <h3 className="text-xl font-bold mb-6">Generate New API Key</h3>
              <form onSubmit={createKey} className="flex flex-col gap-4">
                 <div>
                   <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Key Name (e.g. Website Home Form)</label>
                   <input 
                    type="text" 
                    required 
                    placeholder="Enter name for this key..."
                    className="input-field" 
                    value={newName} 
                    onChange={e => setNewName(e.target.value)}
                   />
                 </div>
                 <button type="submit" disabled={loading} className="btn-primary py-3 mt-4">
                   {loading ? 'Generating...' : 'Generate Secret Key'}
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
