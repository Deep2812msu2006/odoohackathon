// src/components/layout/Topbar.tsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserCheck, LogOut } from 'lucide-react';

export const Topbar: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900/80 px-6 backdrop-blur-md">
      <div className="flex items-center space-x-4">
        <h1 className="text-lg font-semibold text-slate-100 m-0 leading-none">Smart Fleet Portal</h1>
      </div>

      <div className="flex items-center space-x-4">
        {/* User Role Badge */}
        <div className="flex items-center space-x-2 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 border border-slate-700">
          <UserCheck size={14} className="text-orange-400" />
          <span>Role: {user.role.replace('_', ' ')}</span>
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
