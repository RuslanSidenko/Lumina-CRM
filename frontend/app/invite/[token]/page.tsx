'use client'

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE } from '../../config';

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const { token } = use(params);
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/invitations/${token}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'This invitation is invalid or has expired.');
      } else {
        setInvitation(await res.json());
      }
    } catch {
      setError('Connection error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/v1/invitations/fulfill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name: form.name,
          email: form.email,
          password: form.password
        })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/'), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create account.');
      }
    } catch {
      setError('Network error. Please try again.');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-n-950">
      <div className="animate-spin h-8 w-8 border-4 border-accent-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-n-950 p-4">
      <div className="w-full max-w-md space-y-8 animate-slide-up">
        <div className="text-center space-y-2">
           <h1 className="text-3xl font-black text-n-50">Lumina CRM</h1>
           <p className="text-n-400">Join your team</p>
        </div>

        <div className="card p-8">
          {error && !success && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
               <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               {error}
            </div>
          )}

          {success ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
              </div>
              <h2 className="text-xl font-bold text-n-50">Welcome!</h2>
              <p className="text-sm text-n-400">Your account has been created. Redirecting to login...</p>
            </div>
          ) : invitation ? (
            <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                  <label className="input-label text-[10px] uppercase tracking-wider font-bold mb-1.5 block">Full Name</label>
                  <input 
                    type="text" 
                    required 
                    className="input-field" 
                    placeholder="John Doe"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                  />
               </div>
               <div>
                  <label className="input-label text-[10px] uppercase tracking-wider font-bold mb-1.5 block">Email (Username)</label>
                  <input 
                    type="email" 
                    required 
                    className="input-field" 
                    placeholder="name@company.com"
                    value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                  />
               </div>
               <div>
                  <label className="input-label text-[10px] uppercase tracking-wider font-bold mb-1.5 block">Password</label>
                  <input 
                    type="password" 
                    required 
                    className="input-field" 
                    placeholder="Min 6 characters"
                    value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                  />
               </div>
               <div>
                  <label className="input-label text-[10px] uppercase tracking-wider font-bold mb-1.5 block">Confirm Password</label>
                  <input 
                    type="password" 
                    required 
                    className="input-field" 
                    placeholder="Confirm password"
                    value={form.confirmPassword}
                    onChange={e => setForm({...form, confirmPassword: e.target.value})}
                  />
               </div>
               <div className="pt-2">
                 <button 
                  type="submit" 
                  className="btn-primary w-full py-4 text-sm font-bold shadow-lg shadow-accent-500/20"
                 >
                   Create Account
                 </button>
               </div>
               <p className="text-[10px] text-center text-n-500">
                 Role: <span className="font-bold text-accent-400 uppercase tracking-tighter">{invitation.role}</span>
               </p>
            </form>
          ) : (
             <div className="text-center py-6">
                <button 
                  onClick={() => router.push('/')}
                  className="text-sm text-accent-400 hover:text-accent-300 font-medium"
                >
                  Go back to Login
                </button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
