// src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Wrench, 
  Map, 
  Users, 
  TrendingUp, 
  SlidersHorizontal 
} from 'lucide-react';
import type { Vehicle } from '../api/mockDb';

export const Dashboard: React.FC = () => {
  const [kpis, setKpis] = useState({
    activeVehicles: 0,
    availableVehicles: 0,
    inMaintenance: 0,
    activeTrips: 0,
    pendingTrips: 0,
    driversOnDuty: 0,
    fleetUtilizationPct: 0
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  
  // Filter states
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Charts states
  const [utilizationData, setUtilizationData] = useState<{ day: string; utilizationRate: number }[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [kpiRes, vehicleRes, utilRes, costRes] = await Promise.all([
          apiClient.dashboard.getKpis(),
          apiClient.vehicles.list(),
          apiClient.reports.fleetUtilization(),
          apiClient.reports.operationalCost()
        ]);
        
        setKpis(kpiRes.data);
        setVehicles(vehicleRes.data);
        setUtilizationData(utilRes.data);
        setCostBreakdown(costRes.data.breakdown);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, []);

  // Filtered vehicles count and list
  const filteredVehicles = vehicles.filter(v => {
    const matchesRegion = !selectedRegion || v.region?.toLowerCase() === selectedRegion.toLowerCase();
    const matchesStatus = !selectedStatus || v.status === selectedStatus;
    const matchesType = !selectedType || v.type.toLowerCase().includes(selectedType.toLowerCase());
    return matchesRegion && matchesStatus && matchesType;
  });

  const regions = Array.from(new Set(vehicles.map(v => v.region).filter(Boolean)));
  const types = Array.from(new Set(vehicles.map(v => v.type)));

  const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b'];

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-slate-400 text-sm">Loading dashboard analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Operations Control</h1>
          <p className="text-slate-400 text-sm">Live fleet tracking and performance metrics</p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1 */}
        <div className="glass-panel p-6 flex items-center justify-between relative overflow-hidden group hover:border-cyan-500/25 transition-all duration-300">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fleet Utilization</p>
            <h3 className="text-3xl font-extrabold text-cyan-400 glow-text-cyan">{kpis.fleetUtilizationPct}%</h3>
            <p className="text-[10px] text-slate-500">Active vs Total non-retired vehicles</p>
          </div>
          <div className="rounded-2xl bg-cyan-950/45 p-4 border border-cyan-800/30 text-cyan-400">
            <TrendingUp size={24} />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-teal-500"></div>
        </div>

        {/* Card 2 */}
        <div className="glass-panel p-6 flex items-center justify-between relative overflow-hidden group hover:border-violet-500/25 transition-all duration-300">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Trips</p>
            <h3 className="text-3xl font-extrabold text-violet-400 glow-text-violet">{kpis.activeTrips}</h3>
            <p className="text-[10px] text-slate-500">{kpis.pendingTrips} more in draft queue</p>
          </div>
          <div className="rounded-2xl bg-violet-950/45 p-4 border border-violet-800/30 text-violet-400">
            <Map size={24} />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-500"></div>
        </div>

        {/* Card 3 */}
        <div className="glass-panel p-6 flex items-center justify-between relative overflow-hidden group hover:border-slate-700 transition-all duration-300">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">In Service Bay</p>
            <h3 className="text-3xl font-extrabold text-amber-400">{kpis.inMaintenance}</h3>
            <p className="text-[10px] text-slate-500">Vehicles in workshop shop</p>
          </div>
          <div className="rounded-2xl bg-amber-950/40 p-4 border border-amber-800/30 text-amber-400">
            <Wrench size={24} />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-500"></div>
        </div>

        {/* Card 4 */}
        <div className="glass-panel p-6 flex items-center justify-between relative overflow-hidden group hover:border-brand-rose/25 transition-all duration-300">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Drivers on Trip</p>
            <h3 className="text-3xl font-extrabold text-rose-400">{kpis.driversOnDuty}</h3>
            <p className="text-[10px] text-slate-500">Active operators dispatched</p>
          </div>
          <div className="rounded-2xl bg-rose-950/45 p-4 border border-rose-800/30 text-rose-400">
            <Users size={24} />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-pink-500"></div>
        </div>
      </div>

      {/* Interactive Filters Panel */}
      <div className="glass-panel p-6">
        <div className="flex items-center space-x-2 mb-4">
          <SlidersHorizontal size={16} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-300">Quick Vehicle Filter Matrix</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Region</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-200 focus:outline-none"
            >
              <option value="">All Regions</option>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Vehicle Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-200 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="ON_TRIP">ON TRIP</option>
              <option value="IN_SHOP">IN SHOP</option>
              <option value="RETIRED">RETIRED</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Body Class / Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-200 focus:outline-none"
            >
              <option value="">All Types</option>
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Live Filter Summary */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-800/60 pt-4 text-xs text-slate-400">
          <span>Matching fleet vehicles: <strong className="text-slate-200">{filteredVehicles.length}</strong></span>
          {(selectedRegion || selectedStatus || selectedType) && (
            <button 
              onClick={() => { setSelectedRegion(''); setSelectedStatus(''); setSelectedType(''); }}
              className="text-blue-400 hover:text-blue-300 font-semibold"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Utilization trend chart */}
        <div className="glass-panel p-6 lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200">Historical Fleet Utilization</h3>
            <p className="text-[11px] text-slate-400">Average active usage percent over the past 7 days</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={utilizationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUtil" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} unit="%" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#f1f5f9', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="utilizationRate" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorUtil)" name="Utilization Rate" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost breakdown pie chart */}
        <div className="glass-panel p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200">Operating Cost Center</h3>
            <p className="text-[11px] text-slate-400">Total expense distributions across category types</p>
          </div>
          <div className="h-72 w-full flex flex-col justify-between">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {costBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    itemStyle={{ color: '#cbd5e1' }}
                    formatter={(value) => [`$${value}`, 'Amount']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Custom Pie Legend */}
            <div className="grid grid-cols-2 gap-2 border-t border-slate-800/80 pt-3">
              {costBreakdown.map((entry, idx) => (
                <div key={entry.name} className="flex items-center space-x-2 text-xs">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                  <span className="text-slate-400 truncate">{entry.name}:</span>
                  <span className="text-slate-200 font-semibold">${entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filtered Vehicles List */}
      <div className="glass-panel overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200">Live Vehicle Fleet Status</h3>
          <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-400">Filtered: {filteredVehicles.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/30 text-slate-400 font-bold">
                <th className="p-4">Reg Number</th>
                <th className="p-4">Vehicle Model</th>
                <th className="p-4">Region</th>
                <th className="p-4">Type</th>
                <th className="p-4">Odometer</th>
                <th className="p-4">Max Capacity</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                    No vehicles found matching current filter matrix.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map(v => (
                  <tr key={v.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-300">{v.registration_no}</td>
                    <td className="p-4 font-semibold text-slate-200">{v.name}</td>
                    <td className="p-4 text-slate-400">{v.region || '—'}</td>
                    <td className="p-4 text-slate-400">{v.type}</td>
                    <td className="p-4 font-mono text-slate-300">{v.odometer.toLocaleString()} km</td>
                    <td className="p-4 font-mono text-slate-400">{(v.max_load_capacity / 1000).toFixed(1)}t</td>
                    <td className="p-4 text-right">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                        v.status === 'AVAILABLE' ? 'border-emerald-500/20 bg-emerald-950/20 text-emerald-400' :
                        v.status === 'ON_TRIP' ? 'border-blue-500/20 bg-blue-950/20 text-blue-400' :
                        v.status === 'IN_SHOP' ? 'border-amber-500/20 bg-amber-950/20 text-amber-400' :
                        'border-slate-600/20 bg-slate-800/20 text-slate-400'
                      }`}>
                        <span className={`mr-1 h-1.5 w-1.5 rounded-full ${
                          v.status === 'AVAILABLE' ? 'bg-emerald-400 pulse-dot' :
                          v.status === 'ON_TRIP' ? 'bg-blue-400 pulse-dot' :
                          v.status === 'IN_SHOP' ? 'bg-amber-400 pulse-dot' :
                          'bg-slate-400'
                        }`} />
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
