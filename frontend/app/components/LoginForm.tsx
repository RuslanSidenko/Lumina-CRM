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
      setError(res.error || "Login Failed");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full items-center justify-center bg-dark-bg relative overflow-hidden">
      {/* Decorative background gradients */}
      <div className="absolute top-[-10rem] left-[-10rem] w-96 h-96 bg-brand-500/10 rounded-full blur-3xl z-0 pointer-events-none"></div>
      <div className="absolute bottom-[-10rem] right-[-10rem] w-[30rem] h-[30rem] bg-blue-500/10 rounded-full blur-3xl z-0 pointer-events-none"></div>
      
      <div className="glass-panel p-10 w-full max-w-md flex flex-col gap-6 z-10 relative">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-2">Lumina <span className="gradient-text">CRM</span></h2>
          <p className="text-slate-400 text-sm">Sign in with admin@example.com / password</p>
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400 ml-1">Email</label>
            <input 
              className="input-field" 
              type="email" 
              placeholder="admin@example.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400 ml-1">Password</label>
            <input 
              className="input-field" 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button className="btn-primary mt-2 flex justify-center items-center" type="submit" disabled={loading}>
            {loading ? (
               <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
