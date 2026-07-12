// src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { 
  Wrench, 
  Map, 
  Users, 
  TrendingUp, 
  SlidersHorizontal,
  CreditCard,
  Percent,
  Activity,
  Search,
  Filter
} from 'lucide-react';
import type { Vehicle } from '../api/mockDb';
import { Card3D } from '../components/common/Card3D';

const OperationalDashboard: React.FC = () => {
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

  const COLORS = ['#f97316', '#8b5cf6', '#10b981', '#f59e0b'];

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto"></div>
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
        <div className="glass-panel p-6 flex items-center justify-between relative overflow-hidden group hover:border-orange-500/25 transition-all duration-300">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fleet Utilization</p>
            <h3 className="text-3xl font-extrabold text-orange-400 glow-text-orange">{kpis.fleetUtilizationPct}%</h3>
            <p className="text-[10px] text-slate-500">Active vs Total non-retired vehicles</p>
          </div>
          <div className="rounded-2xl bg-orange-950/45 p-4 border border-orange-800/30 text-orange-400">
            <TrendingUp size={24} />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-500"></div>
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
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} unit="%" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#f1f5f9', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="utilizationRate" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorUtil)" name="Utilization Rate" />
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

const CustomFinancialTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const revenue = data.revenue || 0;
    const costs = data.costs || 0;
    const netProfit = revenue - costs;
    const isProfitable = netProfit >= 0;

    return (
      <div className="glass-panel p-4 border border-slate-800 text-xs shadow-2xl space-y-2.5 min-w-[200px] backdrop-blur-xl bg-slate-950/90">
        <p className="font-bold text-slate-100 border-b border-slate-800 pb-1.5">{data.vehicleName} <span className="font-mono text-[10px] text-slate-400">({data.registration})</span></p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2"></span>
              Revenue:
            </span>
            <span className="font-mono font-bold text-slate-200">${revenue.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mr-2"></span>
              Cost:
            </span>
            <span className="font-mono font-bold text-slate-200">${costs.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80">
            <span className="text-slate-400">Net Profit:</span>
            <span className={`font-mono font-extrabold ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isProfitable ? '+' : ''}${netProfit.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const FinancialDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [roiData, setRoiData] = useState<any[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<{ name: string; value: number }[]>([]);
  const [fuelLogs, setFuelLogs] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);

  // Filters for ledger
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadFinancialData = async () => {
      try {
        setLoading(true);
        const [roiRes, costRes, fuelRes, expenseRes, vehicleRes] = await Promise.all([
          apiClient.reports.vehicleRoi(),
          apiClient.reports.operationalCost(),
          apiClient.fuelLogs.list(),
          apiClient.expenses.list(),
          apiClient.vehicles.list()
        ]);
        setRoiData(roiRes.data);
        setCostBreakdown(costRes.data.breakdown);
        setFuelLogs(fuelRes.data);
        setExpenses(expenseRes.data);
        setVehicles(vehicleRes.data);
      } catch (err) {
        console.error('Failed to load financial dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    loadFinancialData();
  }, []);

  // Financial calculations
  const selectedVehicleReg = vehicles.find(v => v.id === selectedVehicle)?.registration_no;

  const displayedRoiData = selectedVehicleReg
    ? roiData.filter(v => v.registration === selectedVehicleReg)
    : roiData;

  const displayedCostBreakdown = selectedVehicle
    ? [
        { name: 'Fuel', value: fuelLogs.filter(f => f.vehicle_id === selectedVehicle).reduce((sum, f) => sum + f.cost, 0) },
        { name: 'Maintenance', value: expenses.filter(e => e.vehicle_id === selectedVehicle && e.type === 'maintenance').reduce((sum, e) => sum + e.amount, 0) },
        { name: 'Tolls', value: expenses.filter(e => e.vehicle_id === selectedVehicle && e.type === 'toll').reduce((sum, e) => sum + e.amount, 0) },
        { name: 'Other', value: expenses.filter(e => e.vehicle_id === selectedVehicle && e.type === 'other').reduce((sum, e) => sum + e.amount, 0) }
      ]
    : costBreakdown;

  const totalRevenue = displayedRoiData.reduce((sum, v) => sum + v.revenue, 0);
  const totalCosts = displayedCostBreakdown.reduce((sum, item) => sum + item.value, 0);
  const netProfit = totalRevenue - totalCosts;
  const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;
  
  const activeRoiVehicles = displayedRoiData.filter(v => v.acquisitionCost > 0);
  const avgRoi = activeRoiVehicles.length > 0 
    ? Math.round((activeRoiVehicles.reduce((sum, v) => sum + v.roi, 0) / activeRoiVehicles.length) * 10) / 10 
    : 0;

  // Merge transactions chronologically
  const mergedTransactions = [
    ...fuelLogs.map(f => ({
      id: f.id,
      date: f.date,
      vehicleId: f.vehicle_id,
      type: 'Fuel',
      category: 'Fuel',
      amount: f.cost,
      description: `Fuel fill-up: ${f.liters}L`,
    })),
    ...expenses.map(e => ({
      id: e.id,
      date: e.date,
      vehicleId: e.vehicle_id,
      type: 'Expense',
      category: e.type.charAt(0).toUpperCase() + e.type.slice(1), // 'Toll', 'Maintenance', 'Other'
      amount: e.amount,
      description: e.notes || `${e.type} expense`,
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filters application
  const filteredTransactions = mergedTransactions.filter(t => {
    const matchesVehicle = !selectedVehicle || t.vehicleId === selectedVehicle;
    const matchesCategory = !selectedCategory || t.category.toLowerCase() === selectedCategory.toLowerCase();
    
    const vehicleObj = vehicles.find(v => v.id === t.vehicleId);
    const vehicleReg = vehicleObj?.registration_no || '';
    const vehicleModel = vehicleObj?.name || '';
    
    const matchesSearch = !searchQuery || 
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicleReg.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicleModel.toLowerCase().includes(searchQuery.toLowerCase());
      
    return matchesVehicle && matchesCategory && matchesSearch;
  });

  const CHART_COLORS = ['#f97316', '#8b5cf6', '#10b981', '#f59e0b'];

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-slate-400 text-sm">Compiling financial graphs and transaction auditing ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Financial Operations Control</h1>
          <p className="text-slate-400 text-sm">Monetary audits, fuel expenses, and ROI performance metrics</p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Revenue */}
        <Card3D theme="emerald" className="h-[150px]">
          <div className="card-glare-3d pop-glare-3d"></div>
          <div className="cyber-lines-3d pop-lines-3d">
            <span></span><span></span><span></span>
          </div>
          <div className="scan-line-3d"></div>
          <div className="glowing-elements-3d">
            <div className="glow-1-3d"></div>
            <div className="glow-2-3d"></div>
          </div>
          <div className="card-particles-3d">
            <span></span><span></span><span></span><span></span>
          </div>
          <div className="corner-elements-3d pop-corners-3d">
            <span></span><span></span><span></span><span></span>
          </div>
          
          <div className="card-content-3d">
            <div className="space-y-2 z-10 pop-text-3d">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Revenue</p>
              <h3 className="text-3xl font-extrabold text-emerald-400 glow-text-emerald">${totalRevenue.toLocaleString()}</h3>
              <p className="text-[10px] text-slate-500">Trip revenues ($2.50 / km)</p>
            </div>
            <div className="rounded-2xl bg-emerald-950/45 p-4 border border-emerald-800/30 text-emerald-400 z-10 pop-icon-3d">
              <TrendingUp size={24} />
            </div>
          </div>
        </Card3D>

        {/* Card 2: Operating Cost */}
        <Card3D theme="rose" className="h-[150px]">
          <div className="card-glare-3d pop-glare-3d"></div>
          <div className="cyber-lines-3d pop-lines-3d">
            <span></span><span></span><span></span>
          </div>
          <div className="scan-line-3d"></div>
          <div className="glowing-elements-3d">
            <div className="glow-1-3d"></div>
            <div className="glow-2-3d"></div>
          </div>
          <div className="card-particles-3d">
            <span></span><span></span><span></span><span></span>
          </div>
          <div className="corner-elements-3d pop-corners-3d">
            <span></span><span></span><span></span><span></span>
          </div>
          
          <div className="card-content-3d">
            <div className="space-y-2 z-10 pop-text-3d">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Operating Cost</p>
              <h3 className="text-3xl font-extrabold text-rose-400 glow-text-rose">${totalCosts.toLocaleString()}</h3>
              <p className="text-[10px] text-slate-500">Fuel, maintenance & tolls</p>
            </div>
            <div className="rounded-2xl bg-rose-950/45 p-4 border border-rose-800/30 text-rose-400 z-10 pop-icon-3d">
              <CreditCard size={24} />
            </div>
          </div>
        </Card3D>

        {/* Card 3: Net Profit */}
        <Card3D theme="violet" className="h-[150px]">
          <div className="card-glare-3d pop-glare-3d"></div>
          <div className="cyber-lines-3d pop-lines-3d">
            <span></span><span></span><span></span>
          </div>
          <div className="scan-line-3d"></div>
          <div className="glowing-elements-3d">
            <div className="glow-1-3d"></div>
            <div className="glow-2-3d"></div>
          </div>
          <div className="card-particles-3d">
            <span></span><span></span><span></span><span></span>
          </div>
          <div className="corner-elements-3d pop-corners-3d">
            <span></span><span></span><span></span><span></span>
          </div>
          
          <div className="card-content-3d">
            <div className="space-y-2 z-10 pop-text-3d">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Profit</p>
              <h3 className="text-3xl font-extrabold text-violet-400 glow-text-violet">${netProfit.toLocaleString()}</h3>
              <p className="text-[10px] text-slate-500">Operating margin: {profitMargin}%</p>
            </div>
            <div className="rounded-2xl bg-violet-950/45 p-4 border border-violet-800/30 text-violet-400 z-10 pop-icon-3d">
              <Activity size={24} />
            </div>
          </div>
        </Card3D>

        {/* Card 4: Average ROI */}
        <Card3D theme="amber" className="h-[150px]">
          <div className="card-glare-3d pop-glare-3d"></div>
          <div className="cyber-lines-3d pop-lines-3d">
            <span></span><span></span><span></span>
          </div>
          <div className="scan-line-3d"></div>
          <div className="glowing-elements-3d">
            <div className="glow-1-3d"></div>
            <div className="glow-2-3d"></div>
          </div>
          <div className="card-particles-3d">
            <span></span><span></span><span></span><span></span>
          </div>
          <div className="corner-elements-3d pop-corners-3d">
            <span></span><span></span><span></span><span></span>
          </div>
          
          <div className="card-content-3d">
            <div className="space-y-2 z-10 pop-text-3d">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average ROI</p>
              <h3 className="text-3xl font-extrabold text-amber-400">{avgRoi}%</h3>
              <p className="text-[10px] text-slate-500">Yield across fleet acquisition</p>
            </div>
            <div className="rounded-2xl bg-amber-950/40 p-4 border border-amber-800/30 text-amber-400 z-10 pop-icon-3d">
              <Percent size={24} />
            </div>
          </div>
        </Card3D>
      </div>

      {/* Main Financial Visualizations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue vs Cost per Vehicle */}
        <div className="glass-panel-chart-3d space-y-4">
          <div className="corner-elements-3d">
            <span></span><span></span><span></span><span></span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">Revenue vs. Operating Cost Comparison</h3>
            <p className="text-[11px] text-slate-400">Total generated revenue vs. aggregate expenses for each vehicle registry</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayedRoiData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={6}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.95}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.25}/>
                  </linearGradient>
                  <linearGradient id="costsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb7185" stopOpacity={0.95}/>
                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0.25}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4" stroke="#1e293b" vertical={false} strokeOpacity={0.4} />
                <XAxis dataKey="registration" stroke="#4c647b" fontSize={9} axisLine={false} tickLine={false} dy={8} />
                <YAxis 
                  stroke="#4c647b" 
                  fontSize={9} 
                  axisLine={false} 
                  tickLine={false} 
                  dx={-8}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} 
                />
                <Tooltip content={<CustomFinancialTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 6 }} />
                <Bar dataKey="revenue" fill="url(#revenueGrad)" stroke="#10b981" strokeWidth={1} name="Revenue" radius={[5, 5, 0, 0]} barSize={10} />
                <Bar dataKey="costs" fill="url(#costsGrad)" stroke="#f43f5e" strokeWidth={1} name="Operating Cost" radius={[5, 5, 0, 0]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Operating Cost Breakdown Donut */}
        <div className="glass-panel-chart-3d space-y-4">
          <div className="corner-elements-3d">
            <span></span><span></span><span></span><span></span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">Operational Cost Centers</h3>
            <p className="text-[11px] text-slate-400">Total expense distributions across category types</p>
          </div>
          <div className="h-72 w-full flex flex-col justify-between">
            <div className="h-56 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={displayedCostBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {displayedCostBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    itemStyle={{ color: '#cbd5e1' }}
                    formatter={(value) => [`$${value}`, 'Amount']}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Central Donut Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Total Expenses</span>
                <span className="text-xl font-extrabold text-slate-200 glow-text-orange">${totalCosts.toLocaleString()}</span>
              </div>
            </div>
            
            {/* Custom Pie Legend Grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-800/80 pt-3">
              {displayedCostBreakdown.map((entry, idx) => (
                <div key={entry.name} className="flex items-center justify-between text-xs bg-slate-950/20 px-3 py-1.5 rounded-xl border border-slate-800/30">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}></div>
                    <span className="text-slate-400 font-medium truncate">{entry.name}:</span>
                  </div>
                  <span className="text-slate-200 font-bold font-mono ml-2">${entry.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Auditing Ledger */}
      <div className="glass-panel">
        <div className="px-6 py-5 border-b border-slate-800/60 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200">Transaction Auditing Ledger</h3>
            <p className="text-[11px] text-slate-400">Chronological history of fuel logs and operational expense invoices</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Search size={14} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search registration or notes..."
                className="pl-9 pr-4 py-2 w-48 rounded-xl border border-slate-800 bg-slate-900 text-xs text-slate-200 focus:outline-none focus:border-orange-500/50"
              />
            </div>

            {/* Vehicle Filter */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Filter size={12} />
              </span>
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs text-slate-200 focus:outline-none focus:border-orange-500/50"
              >
                <option value="">All Vehicles</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.registration_no} ({v.name})</option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Filter size={12} />
              </span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs text-slate-200 focus:outline-none focus:border-orange-500/50"
              >
                <option value="">All Categories</option>
                <option value="Fuel">Fuel</option>
                <option value="Toll">Toll</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/30 text-slate-400 font-bold">
                <th className="p-4">Date</th>
                <th className="p-4">Vehicle</th>
                <th className="p-4">Category</th>
                <th className="p-4">Description</th>
                <th className="p-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">
                    No transactions found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(t => {
                  const vehicleObj = vehicles.find(v => v.id === t.vehicleId);
                  
                  // Stylings for categories
                  const catColors: Record<string, string> = {
                    Fuel: 'border-blue-500/20 bg-blue-950/20 text-blue-400',
                    Maintenance: 'border-amber-500/20 bg-amber-950/20 text-amber-400',
                    Toll: 'border-purple-500/20 bg-purple-950/20 text-purple-400',
                    Other: 'border-slate-600/20 bg-slate-800/20 text-slate-400'
                  };
                  
                  return (
                    <tr key={t.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-4 text-slate-400 font-mono">
                        {new Date(t.date).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-slate-200">{vehicleObj?.name || '—'}</p>
                        <span className="font-mono text-[10px] text-slate-500">{vehicleObj?.registration_no || '—'}</span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${catColors[t.category] || catColors['Other']}`}>
                          {t.category}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300 max-w-xs truncate" title={t.description}>
                        {t.description}
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-slate-200">
                        ${t.amount.toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === 'FINANCIAL_ANALYST') {
    return <FinancialDashboard />;
  }

  return <OperationalDashboard />;
};
