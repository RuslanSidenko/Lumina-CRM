'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE } from '../config';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
      } else {
        setError(data.error || 'Something went wrong.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-n-950 p-4">
      <div className="w-full max-w-sm space-y-8 animate-slide-up">
        <div className="text-center space-y-2">
           <h1 className="text-3xl font-black text-n-50">Reset Password</h1>
           <p className="text-n-400">Enter your email to receive a recovery link</p>
        </div>

        <div className="card p-8">
          {message ? (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
              </div>
              <p className="text-sm text-n-300 leading-relaxed">{message}</p>
              <button 
                onClick={() => router.push('/')}
                className="text-accent-400 hover:text-accent-300 text-sm font-bold uppercase tracking-widest"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
               {error && (
                 <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                   <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   {error}
                 </div>
               )}
               
               <div>
                  <label className="input-label text-[10px] uppercase tracking-wider font-bold mb-1.5 block">Email Address</label>
                  <input 
                    type="email" 
                    required 
                    className="input-field" 
                    placeholder="name@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
               </div>

               <div className="pt-2">
                 <button 
                  type="submit" 
                  disabled={loading}
                  className="btn-primary w-full py-4 text-sm font-bold shadow-lg shadow-accent-500/20"
                 >
                   {loading ? 'Sending...' : 'Send Recovery Link'}
                 </button>
               </div>
               
               <div className="text-center pt-2">
                  <button 
                    type="button"
                    onClick={() => router.push('/')}
                    className="text-[10px] text-n-500 hover:text-n-300 uppercase font-bold tracking-widest"
                  >
                    Cancel
                  </button>
               </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
