'use client'

import { useState } from 'react';
import { loginAction } from '../actions/auth';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await loginAction(email, password);
    if (res.success) {
      router.refresh();
    } else {
      setError(res.error || 'Login failed. Check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-n-900 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-accent-500/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-violet-600/6 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent-500/15 border border-accent-500/30 mb-4">
            <svg className="w-6 h-6 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-n-50 tracking-tight">
            Lumina<span className="gradient-text">CRM</span>
          </h1>
          <p className="text-sm text-n-400 mt-1">Sign in to your workspace</p>
        </div>

        {/* Card */}
        <div className="card p-6 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="input-label">Email</label>
              <input
                className="input-field"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="input-label">Password</label>
              <input
                className="input-field"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn-primary w-full mt-2 h-10" type="submit" disabled={loading}>
              {loading ? (
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-n-500 mt-4">
          Default: admin@example.com / password
        </p>
      </div>
    </div>
  );
}
