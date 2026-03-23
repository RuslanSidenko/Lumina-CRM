'use client'

import { useState, useEffect } from 'react';
import { API_BASE } from '../config';

interface UserManagementProps {
  token: string;
}

export default function UserManagement({ token }: UserManagementProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteRole, setInviteRole] = useState('agent');
  const [inviteLink, setInviteLink] = useState('');
  const [form, setForm] = useState({ username: '', name: '', email: '', password: '', role: 'agent' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const generateInvite = async () => {
    const res = await fetch(`${API_BASE}/api/v1/invitations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ role: inviteRole })
    });
    if (res.ok) {
      const data = await res.json();
      const fullUrl = `${window.location.protocol}//${window.location.host}${data.invite_url}`;
      setInviteLink(fullUrl);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch(`${API_BASE}/api/v1/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/api/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      setShowAddForm(false);
      setForm({ username: '', name: '', email: '', password: '', role: 'agent' });
      fetchUsers();
    }
  };

  const updateRole = async (id: number, role: string) => {
    const res = await fetch(`${API_BASE}/api/v1/users/${id}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ role })
    });
    if (res.ok) fetchUsers();
  };

  const deleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to remove this user?')) return;
    const res = await fetch(`${API_BASE}/api/v1/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) fetchUsers();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Team Management</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => { setShowInviteForm(true); setInviteLink(''); }}
            className="btn-ghost py-2 px-4 text-sm border border-white/10"
          >
            Invite User
          </button>
          <button 
            onClick={() => setShowAddForm(true)}
            className="btn-primary py-2 px-4 text-sm"
          >
            Add Team Member
          </button>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Joined</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4 font-medium text-slate-200">{u.name}</td>
                <td className="px-6 py-4 text-slate-400">{u.email}</td>
                <td className="px-6 py-4">
                  <select 
                    value={u.role}
                    disabled={u.role === 'admin'}
                    onChange={(e) => updateRole(u.id, e.target.value)}
                    className={`bg-transparent border-none text-[10px] font-bold uppercase cursor-pointer focus:ring-0 ${
                      u.role === 'admin' ? 'text-purple-400 opacity-50 cursor-not-allowed' : 'text-blue-400'
                    }`}
                  >
                    <option value="agent" className="bg-slate-900">Agent</option>
                    <option value="admin" className="bg-slate-900" disabled>Admin</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-slate-500 text-xs text-nowrap">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => deleteUser(u.id)}
                    disabled={u.role === 'admin'}
                    className={`text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400 ${u.role === 'admin' ? 'invisible pointer-events-none' : ''}`}
                    title={u.role === 'admin' ? "Admins cannot be deleted" : "Delete user"}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showInviteForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-bg/80 backdrop-blur-sm">
           <div className="glass-panel w-full max-w-sm p-8 relative">
              <button 
                onClick={() => setShowInviteForm(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
              <h3 className="text-xl font-bold mb-2">Invite Link</h3>
              <p className="text-xs text-slate-500 mb-6">Generates a one-hour link for a new member.</p>
              
              {!inviteLink ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Role</label>
                    <select 
                      className="input-field" 
                      value={inviteRole} 
                      onChange={e => setInviteRole(e.target.value)}
                    >
                      <option value="agent">Agent</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  <button 
                    onClick={generateInvite}
                    className="btn-primary py-3 w-full"
                  >
                    Generate 1h Link
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg break-all text-xs font-mono text-blue-400 leading-relaxed">
                    {inviteLink}
                  </div>
                  <button 
                    onClick={() => { navigator.clipboard.writeText(inviteLink); alert('Copied to clipboard'); }}
                    className="btn-ghost py-3 w-full border border-white/10 text-sm"
                  >
                    Copy Link
                  </button>
                </div>
              )}
           </div>
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-bg/80 backdrop-blur-sm">
           <div className="glass-panel w-full max-w-md p-8 relative">
              <button 
                onClick={() => setShowAddForm(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
              <h3 className="text-xl font-bold mb-6">Add New User</h3>
              <form onSubmit={createUser} className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Username</label>
                    <input
                     type="text"
                     className="input-field"
                     placeholder="Optional"
                     value={form.username}
                     onChange={e => setForm({...form, username: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Full Name</label>
                    <input
                     type="text"
                     required
                     className="input-field"
                     value={form.name}
                     onChange={e => setForm({...form, name: e.target.value})}
                    />
                  </div>
                 <div>
                   <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Email Address</label>
                   <input 
                    type="email" 
                    required 
                    className="input-field" 
                    value={form.email} 
                    onChange={e => setForm({...form, email: e.target.value})}
                   />
                 </div>
                 <div>
                   <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Initial Password</label>
                   <input 
                    type="password" 
                    required 
                    className="input-field" 
                    value={form.password} 
                    onChange={e => setForm({...form, password: e.target.value})}
                   />
                 </div>
                 <div>
                   <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Assigned Role</label>
                   <select 
                    className="input-field" 
                    value={form.role} 
                    onChange={e => setForm({...form, role: e.target.value})}
                   >
                     <option value="agent">Agent</option>
                     <option value="admin">Administrator</option>
                   </select>
                 </div>
                 <button type="submit" className="btn-primary py-3 mt-4">Create Account</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
