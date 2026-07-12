// src/components/layout/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Navigation, 
  Wrench, 
  DollarSign, 
  BarChart3,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { user } = useAuth();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] },
    { to: '/vehicles', label: 'Vehicles', icon: Truck, roles: ['FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] },
    { to: '/drivers', label: 'Drivers', icon: Users, roles: ['FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] },
    { to: '/trips', label: 'Trips', icon: Navigation, roles: ['FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] },
    { to: '/maintenance', label: 'Maintenance', icon: Wrench, roles: ['FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] },
    { to: '/expenses', label: 'Fuel & Expenses', icon: DollarSign, roles: ['FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] },
    { to: '/reports', label: 'Reports & ROI', icon: BarChart3, roles: ['FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] },
  ];

  const filteredItems = navItems.filter(item => !user || item.roles.includes(user.role));

  return (
    <aside className={`fixed top-0 left-0 z-40 h-screen border-r border-slate-800 bg-slate-900 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 font-bold text-white shadow-lg shadow-cyan-500/20">
              TO
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 via-teal-300 to-violet-400 bg-clip-text text-transparent glow-text-cyan">
              TransitOps
            </span>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 font-bold text-white shadow-lg shadow-cyan-500/20">
            TO
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <nav className="mt-6 space-y-1 px-3">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => 
                `flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group border-l-4 ${
                  isActive 
                    ? 'bg-gradient-to-r from-cyan-950/30 to-violet-950/20 border-cyan-500 text-cyan-400 shadow-md shadow-cyan-950/10' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 border-transparent'
                }`
              }
            >
              <Icon className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${collapsed ? 'mx-auto' : 'mr-3'}`} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {!collapsed && user && (
        <div className="absolute bottom-6 left-4 right-4 rounded-2xl bg-slate-800/50 p-4 border border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-200 font-bold">
              {user.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-200">{user.name}</p>
              <span className="inline-block mt-0.5 rounded-full bg-cyan-950/40 border border-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-400">
                {user.role.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
