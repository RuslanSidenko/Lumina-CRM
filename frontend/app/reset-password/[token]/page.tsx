'use client'

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE } from '../../config';

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const { token } = use(params);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ password: '', confirmPassword: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: form.password
        })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/'), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to reset password.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-n-950 p-4">
      <div className="w-full max-w-sm space-y-8 animate-slide-up">
        <div className="text-center space-y-2">
           <h1 className="text-3xl font-black text-n-50">New Password</h1>
           <p className="text-n-400">Set your new account password</p>
        </div>

        <div className="card p-8">
          {error && (
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
              <h2 className="text-xl font-bold text-n-50">Success!</h2>
              <p className="text-sm text-n-400 leading-relaxed">Your password has been reset. Redirecting to login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
               <div>
                  <label className="input-label text-[10px] uppercase tracking-wider font-bold mb-1.5 block">New Password</label>
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
                  disabled={loading}
                  className="btn-primary w-full py-4 text-sm font-bold shadow-lg shadow-accent-500/20"
                 >
                   {loading ? 'Redefining...' : 'Update Password'}
                 </button>
               </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
