import React, { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLogin: (password: string) => void;
  error?: string;
  title?: string;
}

export default function Login({ onLogin, error, title = "Akses Terbatas" }: LoginProps) {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(password);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-black text-center text-slate-800 mb-2 uppercase tracking-tight">{title}</h1>
        <p className="text-center text-slate-500 mb-8 font-medium">Masukkan kata sandi untuk melanjutkan</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 pl-1">Kata Sandi</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-200 p-4 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all focus:ring-4 focus:ring-indigo-500/10"
              placeholder="••••••••"
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-sm font-bold mt-2 pl-1 animate-pulse">{error}</p>
            )}
          </div>
          
          <button 
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
          >
            Masuk <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
