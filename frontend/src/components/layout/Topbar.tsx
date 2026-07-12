// src/components/layout/Topbar.tsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, RefreshCw, UserCheck } from 'lucide-react';
import type { Role } from '../../api/mockDb';

export const Topbar: React.FC = () => {
  const { user, logout, changeMockRole } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const roles: { value: Role; label: string; desc: string }[] = [
    { value: 'FLEET_MANAGER', label: 'Fleet Manager', desc: 'Manage vehicles, maintenance, view ROI' },
    { value: 'DRIVER', label: 'Driver', desc: 'Create & manage trips, odometer, fuel logs' },
    { value: 'SAFETY_OFFICER', label: 'Safety Officer', desc: 'Manage drivers, scores, license exps' },
    { value: 'FINANCIAL_ANALYST', label: 'Financial Analyst', desc: 'Log fuel & expenses, view reports' }
  ];

  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900/80 px-6 backdrop-blur-md">
      <div className="flex items-center space-x-4">
        <h1 className="text-lg font-semibold text-slate-100 m-0 leading-none">Smart Fleet Portal</h1>
      </div>

      <div className="flex items-center space-x-4">
        {/* Demo Fast Switcher */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all duration-200"
          >
            <UserCheck size={14} className="text-orange-400" />
            <span>Role: {user.role.replace('_', ' ')}</span>
            <RefreshCw size={12} className="text-slate-400" />
          </button>

          {dropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 z-50 w-72 rounded-2xl border border-slate-800 bg-slate-900 p-2 shadow-2xl">
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Demo Role Switcher</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Toggle roles to test specific page controls and rules instantly.</p>
                </div>
                <div className="mt-1 space-y-1">
                  {roles.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => {
                        changeMockRole(r.value);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left rounded-xl px-3 py-2 text-xs transition-all duration-200 ${
                        user.role === r.value 
                          ? 'bg-orange-600/10 border border-orange-500/20 text-orange-400' 
                          : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-transparent'
                      }`}
                    >
                      <p className="font-semibold">{r.label}</p>
                      <p className="text-[10px] text-slate-500 truncate">{r.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile / Log out */}
        <div className="h-6 w-[1px] bg-slate-800"></div>

        <button 
          onClick={logout}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-all duration-200"
          title="Sign Out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};
