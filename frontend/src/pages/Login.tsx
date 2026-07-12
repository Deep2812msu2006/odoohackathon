// src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Truck, ShieldCheck, UserCheck, Landmark } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed. Try again.');
    }
  };

  const handleQuickLogin = async (roleEmail: string) => {
    setError('');
    try {
      await login(roleEmail, 'password123');
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Quick login failed.');
    }
  };

  const roleLogins = [
    { email: 'manager@transitops.com', label: 'Fleet Manager', desc: 'Frank Manager', icon: UserCheck, color: 'border-cyan-500/20 bg-cyan-950/20 text-cyan-400 hover:border-cyan-500/50 hover:shadow-cyan-950/30' },
    { email: 'driver@transitops.com', label: 'Driver', desc: 'Dave Driver', icon: Truck, color: 'border-emerald-500/20 bg-emerald-950/20 text-emerald-400 hover:border-emerald-500/50 hover:shadow-emerald-950/30' },
    { email: 'safety@transitops.com', label: 'Safety Officer', desc: 'Sarah Safety', icon: ShieldCheck, color: 'border-violet-500/20 bg-violet-950/20 text-violet-400 hover:border-violet-500/50 hover:shadow-violet-950/30' },
    { email: 'finance@transitops.com', label: 'Financial Analyst', desc: 'Fiona Finance', icon: Landmark, color: 'border-amber-500/20 bg-amber-950/20 text-amber-400 hover:border-amber-500/50 hover:shadow-amber-950/30' }
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-violet-600 font-bold text-white shadow-xl shadow-cyan-500/20 text-2xl">
            TO
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent sm:text-4xl glow-text-cyan">
            TransitOps Portal
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Smart Transport Operations Platform
          </p>
        </div>

        <div className="glass-panel p-8">
          <form className="space-y-6" onSubmit={handleLoginSubmit}>
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-3 text-sm text-red-400 text-center">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors duration-200"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-3 text-sm btn-gradient"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent mx-auto"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Quick Access Grid */}
          <div className="mt-8">
            <div className="relative flex items-center justify-center my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <span className="relative bg-slate-900 px-3 text-xs font-bold uppercase tracking-widest text-slate-500">
                Demo Quick Roles
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {roleLogins.map((role) => {
                const Icon = role.icon;
                return (
                  <button
                    key={role.email}
                    onClick={() => handleQuickLogin(role.email)}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-4 text-center hover:scale-[1.02] cursor-pointer transition-all duration-200 ${role.color}`}
                  >
                    <Icon className="h-6 w-6 mb-2" />
                    <span className="text-xs font-bold">{role.label}</span>
                    <span className="text-[10px] opacity-70 mt-0.5">{role.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
