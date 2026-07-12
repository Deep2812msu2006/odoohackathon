// src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, LabelList
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
  Filter,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  BellRing,
  GraduationCap,
  CalendarDays,
  DollarSign,
  FileSpreadsheet,
  Disc,
  Gauge,
  Compass,
  ShieldAlert,
  Clock,
  AlertCircle
} from 'lucide-react';
import type { Vehicle, Driver } from '../api/mockDb';
import { Card3D } from '../components/common/Card3D';

const OperationalDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const starShadows = React.useMemo(() => {
    const generateStarShadows = (count: number) => {
      const shadows = [];
      for (let i = 0; i < count; i++) {
        const x = Math.floor(Math.random() * 2000);
        const y = Math.floor(Math.random() * 2000);
        shadows.push(`${x}px ${y}px #ffffff`);
      }
      return shadows.join(', ');
    };
    return {
      slow: generateStarShadows(150),
      medium: generateStarShadows(100),
      fast: generateStarShadows(50),
    };
  }, []);

  // General KPIs
  const [kpis, setKpis] = useState({
    activeVehicles: 0,
    availableVehicles: 0,
    inMaintenance: 0,
    activeTrips: 0,
    pendingTrips: 0,
    driversOnDuty: 0,
    fleetUtilizationPct: 0
  });

  // Resources state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  
  // Filter states (Fleet Manager)
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Charts states
  const [utilizationData, setUtilizationData] = useState<{ day: string; utilizationRate: number }[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<{ name: string; value: number }[]>([]);

  // Safety Officer states
  const [safetyAlerts, setSafetyAlerts] = useState([
    { id: '1', driverName: 'Dave Driver', vehicleReg: 'TX-4809', type: 'Harsh Braking Event', time: '10 mins ago', severity: 'HIGH', location: 'I-95 Northbound Km 45' },
    { id: '2', driverName: 'Dan Transit', vehicleReg: 'CA-1029', type: 'Overspeed Limit Alert (115 km/h)', time: '42 mins ago', severity: 'CRITICAL', location: 'US Route 101 Intersection' },
    { id: '3', driverName: 'Charlie Express', vehicleReg: 'FL-9081', type: 'Harsh Cornering Warning', time: '2 hrs ago', severity: 'MEDIUM', location: 'Downtown Express Way Loop' },
    { id: '4', driverName: 'Bob Trucker', vehicleReg: 'NY-5524', type: 'Odometer Anomaly Check', time: '5 hrs ago', severity: 'LOW', location: 'Bay Ridge Station' }
  ]);



  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [kpiRes, vehicleRes, utilRes, costRes, driverRes] = await Promise.all([
          apiClient.dashboard.getKpis(),
          apiClient.vehicles.list(),
          apiClient.reports.fleetUtilization(),
          apiClient.reports.operationalCost(),
          apiClient.drivers.list()
        ]);
        
        setKpis(kpiRes.data);
        setVehicles(vehicleRes.data);
        setUtilizationData(utilRes.data);
        setCostBreakdown(costRes.data.breakdown);
        setDrivers(driverRes.data);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, []);

  const handleAcknowledgeAlert = (id: string) => {
    setSafetyAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const fetchDrivers = async () => {
    try {
      const driverRes = await apiClient.drivers.list();
      setDrivers(driverRes.data);
    } catch (err) {
      console.error('Failed to reload drivers list', err);
    }
  };

  const handleAssignTraining = async (driverId: string, name: string) => {
    try {
      await apiClient.drivers.update(driverId, { notes: 'Training Enrolled' });
      alert(`Success: Safety training enrolled for ${name}. Refresher course scheduled.`);
      fetchDrivers();
    } catch (err) {
      console.error(err);
      alert('Failed to enroll driver.');
    }
  };

  const handleSuspendDriver = async (driverId: string, name: string) => {
    try {
      await apiClient.drivers.update(driverId, { status: 'SUSPENDED' });
      alert(`Suspended: Operator ${name} has been set to SUSPENDED duty status.`);
      fetchDrivers();
    } catch (err) {
      console.error(err);
      alert('Failed to suspend driver.');
    }
  };

  const handleClearCompliance = async (driverId: string, name: string) => {
    try {
      await apiClient.drivers.update(driverId, { 
        status: 'AVAILABLE', 
        safety_score: 90, 
        notes: '' 
      });
      alert(`Cleared: Compliance cleared for ${name}. Status set to AVAILABLE and safety score restored to 90%.`);
      fetchDrivers();
    } catch (err) {
      console.error(err);
      alert('Failed to clear compliance.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-slate-400 text-sm">Compiling workspace telemetry...</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#f97316', '#8b5cf6', '#10b981', '#f59e0b'];

  if (!user) return null;

  // ==========================================
  // RENDER 1: SAFETY OFFICER DASHBOARD (Primary Focus)
  // ==========================================
  if (user.role === 'SAFETY_OFFICER') {
    // Dynamic computations from live driver data
    const totalDrivers = drivers.length;
    const avgSafetyScore = totalDrivers > 0 
      ? Math.round(drivers.reduce((sum, d) => sum + d.safety_score, 0) / totalDrivers)
      : 85;
    
    const expiringCdlCount = drivers.filter(d => {
      const expiry = new Date(d.license_expiry_date);
      const now = new Date();
      const diffTime = expiry.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30; // Expired or expiring within 30 days
    }).length;

    const lowScoreCount = drivers.filter(d => d.safety_score < 80).length;

    const safetyScoreDistribution = [
      { name: 'Excellent (>=90)', count: drivers.filter(d => d.safety_score >= 90).length, fill: '#10b981' },
      { name: 'Good (80-89)', count: drivers.filter(d => d.safety_score >= 80 && d.safety_score < 90).length, fill: '#8b5cf6' },
      { name: 'Critical (<80)', count: drivers.filter(d => d.safety_score < 80).length, fill: '#f97316' }
    ];

    return (
      <div className="relative -m-6 md:-m-8 p-6 md:p-8 space-y-6 overflow-hidden rounded-2xl min-h-[calc(100vh-4rem)]" style={{
        background: 'radial-gradient(ellipse at bottom, #2b1836 0%, #060a0d 100%)',
      }}>
        {/* Parallax Stars Layers */}
        <div className="safety-stars-layer animate-stars-slow" style={{ width: '1px', height: '1px', boxShadow: starShadows.slow }} />
        <div className="safety-stars-layer animate-stars-medium" style={{ width: '2px', height: '2px', boxShadow: starShadows.medium }} />
        <div className="safety-stars-layer animate-stars-fast" style={{ width: '3px', height: '3px', boxShadow: starShadows.fast }} />

        {/* Content Wrapper to render on top of stars */}
        <div className="relative z-10 space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start md:items-center">
            <div className="p-2.5 rounded-2xl bg-orange-950/40 border border-orange-500/20 text-orange-400 mr-4 shadow-[0_0_20px_rgba(249,115,22,0.15)] flex-shrink-0">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-orange-400 via-violet-400 to-purple-500 bg-clip-text text-transparent" style={{ filter: 'drop-shadow(0 2px 8px rgba(249,115,22,0.15))' }}>
                Safety & Driver Compliance Control
              </h1>
              <p className="text-slate-400 text-xs md:text-sm font-medium tracking-wide mt-1">
                Monitor fleet operator safety scores, real-time alert logs, and credentials validation status
              </p>
            </div>
          </div>
        </div>

        {/* Safety KPIs */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1 */}
          <div className="uiverse-card-orange h-full cursor-default">
            <div className="uiverse-card-inner h-full p-6 flex items-center justify-between relative overflow-hidden group bg-gradient-to-br from-orange-500/5 to-slate-950/90">
              <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-orange-500/10 blur-xl group-hover:bg-orange-500/20 transition-all duration-500" />
              <div className="space-y-2 relative z-10">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fleet Safety Score</p>
                <h3 className="text-3xl font-extrabold text-orange-400 glow-text-orange" style={{ textShadow: '0 0 10px rgba(249,115,22,0.3)' }}>{avgSafetyScore} / 100</h3>
                <p className="text-[10px] text-slate-500">Average of all registered drivers</p>
              </div>
              <div className="rounded-2xl bg-orange-950/40 p-4 border border-orange-850/30 text-orange-400 group-hover:border-orange-500/50 group-hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all duration-300 relative z-10">
                <ShieldCheck size={24} />
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="uiverse-card-violet h-full cursor-default">
            <div className="uiverse-card-inner h-full p-6 flex items-center justify-between relative overflow-hidden group bg-gradient-to-br from-violet-500/5 to-slate-950/90">
              <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-violet-500/10 blur-xl group-hover:bg-violet-500/20 transition-all duration-500" />
              <div className="space-y-2 relative z-10">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Telemetry Alerts</p>
                <h3 className="text-3xl font-extrabold text-violet-400" style={{ textShadow: '0 0 10px rgba(139,92,246,0.3)' }}>{safetyAlerts.length} Warnings</h3>
                <p className="text-[10px] text-slate-500">Real-time driver violations queued</p>
              </div>
              <div className="rounded-2xl bg-violet-950/40 p-4 border border-violet-850/30 text-violet-400 group-hover:border-violet-500/50 group-hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all duration-300 relative z-10">
                <BellRing size={24} />
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="uiverse-card-rose h-full cursor-default">
            <div className="uiverse-card-inner h-full p-6 flex items-center justify-between relative overflow-hidden group bg-gradient-to-br from-rose-500/5 to-slate-950/90">
              <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-rose-500/10 blur-xl group-hover:bg-rose-500/20 transition-all duration-500" />
              <div className="space-y-2 relative z-10">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Expiring Licenses</p>
                <h3 className="text-3xl font-extrabold text-rose-400" style={{ textShadow: '0 0 10px rgba(244,63,94,0.3)' }}>{expiringCdlCount} Drivers</h3>
                <p className="text-[10px] text-slate-500">CDL expirations within 30 days</p>
              </div>
              <div className="rounded-2xl bg-rose-950/40 p-4 border border-rose-850/30 text-rose-400 group-hover:border-rose-500/50 group-hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all duration-300 relative z-10">
                <CalendarDays size={24} />
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="uiverse-card-emerald h-full cursor-default">
            <div className="uiverse-card-inner h-full p-6 flex items-center justify-between relative overflow-hidden group bg-gradient-to-br from-emerald-500/5 to-slate-950/90">
              <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-emerald-500/10 blur-xl group-hover:bg-emerald-500/20 transition-all duration-500" />
              <div className="space-y-2 relative z-10">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Risk Training Queue</p>
                <h3 className="text-3xl font-extrabold text-emerald-400" style={{ textShadow: '0 0 10px rgba(16,185,129,0.3)' }}>{lowScoreCount} Profiles</h3>
                <p className="text-[10px] text-slate-500">Drivers scoring under 80%</p>
              </div>
              <div className="rounded-2xl bg-emerald-950/40 p-4 border border-emerald-850/30 text-emerald-400 group-hover:border-emerald-500/50 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300 relative z-10">
                <GraduationCap size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Telemetry Event Alerts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Alerts Feed */}
          <div className="glass-panel p-6 lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="text-orange-500" size={18} />
                <h3 className="text-sm font-bold text-slate-200">Real-Time Vehicle Safety Warnings</h3>
              </div>
              <span className="rounded-full bg-orange-950 border border-orange-500/20 px-2.5 py-0.5 text-[10px] text-orange-400 font-bold uppercase tracking-wider flex items-center space-x-1.5 animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500 pulse-dot"></span>
                <span>Live Telemetry</span>
              </span>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {safetyAlerts.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/10">
                  <CheckCircle2 className="mx-auto text-emerald-400 mb-2" size={32} />
                  <p className="text-xs text-slate-400">All operator alerts resolved. Fleet is driving safely.</p>
                </div>
              ) : (
                safetyAlerts.map(alert => {
                  const isCritical = alert.severity === 'CRITICAL';
                  const isHigh = alert.severity === 'HIGH';
                  const isMedium = alert.severity === 'MEDIUM';
                  
                  const colorClass = isCritical ? 'border-red-500/30 hover:border-red-500/50 shadow-red-950/5' :
                                     isHigh ? 'border-orange-500/30 hover:border-orange-500/50 shadow-orange-950/5' :
                                     isMedium ? 'border-violet-500/30 hover:border-violet-500/50 shadow-violet-950/5' :
                                     'border-slate-800 hover:border-slate-700';

                  const badgeClass = isCritical ? 'bg-red-950/60 text-red-400 border-red-500/30' :
                                     isHigh ? 'bg-orange-950/60 text-orange-450 text-orange-400 border-orange-500/30' :
                                     isMedium ? 'bg-violet-950/60 text-violet-400 border-violet-500/30' :
                                     'bg-slate-800/80 text-slate-400 border-slate-700';

                  const leftStripeColor = isCritical ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' :
                                           isHigh ? 'bg-orange-500 shadow-[0_0_10px_#f97316]' :
                                           isMedium ? 'bg-violet-500 shadow-[0_0_10px_#8b5cf6]' :
                                           'bg-slate-500';

                  // Dynamic icon selection
                  const getAlertIcon = () => {
                    const typeLower = alert.type.toLowerCase();
                    if (typeLower.includes('braking')) return <Disc size={15} className="text-orange-450 text-orange-400" />;
                    if (typeLower.includes('overspeed') || typeLower.includes('speed')) return <Gauge size={15} className="text-red-400" />;
                    if (typeLower.includes('cornering') || typeLower.includes('drift')) return <Compass size={15} className="text-violet-400" />;
                    return <ShieldAlert size={15} className="text-slate-400" />;
                  };

                  return (
                    <div 
                      key={alert.id} 
                      className={`relative overflow-hidden rounded-xl border ${colorClass} bg-slate-900/50 backdrop-blur-md p-4 flex items-center justify-between gap-4 transition-all duration-300 hover:translate-x-1 shadow-md hover:shadow-lg`}
                    >
                      {/* Left glowing stripe accent */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${leftStripeColor}`} />

                      <div className="flex items-start space-x-3 pl-1.5">
                        <div className="mt-1.5 p-2 rounded-xl bg-slate-950/65 border border-slate-850">
                          {getAlertIcon()}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[8px] font-extrabold uppercase border tracking-wider ${badgeClass}`}>
                              {alert.severity}
                            </span>
                            <h4 className="text-xs font-extrabold text-slate-200 tracking-wide">{alert.type}</h4>
                          </div>
                          
                          <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                            <span>Driver: <strong className="text-slate-200">{alert.driverName}</strong></span>
                            <span className="text-slate-650">•</span>
                            <span>Vehicle: <strong className="text-slate-200 font-mono">{alert.vehicleReg}</strong></span>
                          </div>

                          <div className="flex items-center space-x-2 text-[9px] text-slate-500">
                            <span className="truncate max-w-[200px]" title={alert.location}>{alert.location}</span>
                            <span>•</span>
                            <span className="flex items-center space-x-1">
                              <Clock size={10} />
                              <span>{alert.time}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                        className="flex-shrink-0 px-3 py-1.5 text-[10px] font-bold rounded-lg border border-slate-700 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-slate-200 hover:border-slate-600 transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
                      >
                        Dismiss
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Safety Score Distribution Chart */}
          <div className="glass-panel p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Safety Score Distribution</h3>
              <p className="text-[11px] text-slate-400">Driver safety brackets count</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={safetyScoreDistribution} margin={{ top: 25, right: 20, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="safetyLineGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                    <linearGradient id="safetyAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                  <Area
                    dataKey="count"
                    type="natural"
                    stroke="url(#safetyLineGradient)"
                    strokeWidth={3}
                    fill="url(#safetyAreaGradient)"
                    filter="url(#glow)"
                    dot={{
                      fill: '#0f172a',
                      stroke: '#8b5cf6',
                      strokeWidth: 2,
                      r: 4
                    }}
                    activeDot={{
                      fill: '#8b5cf6',
                      stroke: '#ffffff',
                      strokeWidth: 1.5,
                      r: 6
                    }}
                  >
                    <LabelList
                      position="top"
                      offset={12}
                      className="fill-slate-200 font-extrabold"
                      fill="#e2e8f0"
                      fontSize={11}
                    />
                  </Area>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Live Driver Safety Scores & Training Action */}
        <div className="glass-panel overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200">Driver Performance & Credentials Audit</h3>
            <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-400">Active Operators: {totalDrivers}</span>
          </div>
          <div className="overflow-x-auto p-4 pt-2">
            <table className="w-full text-left text-xs border-separate border-spacing-y-2.5">
              <thead>
                <tr className="text-slate-400 font-extrabold uppercase tracking-wider text-[9px]">
                  <th className="p-3 pl-6">Driver Name</th>
                  <th className="p-3">License Number</th>
                  <th className="p-3">CDL Expiry</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Safety Performance Score</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map(d => {
                  const scoreColor = d.safety_score >= 90 ? 'text-emerald-450 text-emerald-400' :
                                     d.safety_score >= 80 ? 'text-violet-400' : 'text-orange-400';
                  
                  // Style CDL Expiry logic
                  const isCdlExpiredOrExpiringSoon = (expiryStr: string) => {
                    const expiry = new Date(expiryStr);
                    const today = new Date('2026-07-12');
                    const diffTime = expiry.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays <= 30; // Expired or expiring within 30 days
                  };
                  const isCdlAlert = isCdlExpiredOrExpiringSoon(d.license_expiry_date);

                  return (
                    <tr 
                      key={d.id} 
                      className="group hover:scale-[1.005] transition-all duration-300"
                    >
                      <td className="p-4 pl-6 bg-slate-900/25 border-t border-b first:border-l border-slate-800/80 first:rounded-l-2xl group-hover:bg-slate-800/25 group-hover:border-slate-700/60 transition-all duration-300">
                        <div className="flex items-center">
                          <div className="w-7 h-7 rounded-xl bg-slate-950/70 border border-slate-850 flex items-center justify-center font-extrabold text-slate-350 text-[10px] mr-3 group-hover:border-slate-750 group-hover:text-slate-200 transition-all duration-300 shadow-inner">
                            {d.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="font-extrabold text-slate-200 tracking-wide">{d.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-400 font-mono bg-slate-900/25 border-t border-b border-slate-800/80 group-hover:bg-slate-800/25 group-hover:border-slate-700/60 transition-all duration-300">
                        {d.license_number}
                      </td>
                      <td className={`p-4 font-mono bg-slate-900/25 border-t border-b border-slate-800/80 group-hover:bg-slate-800/25 group-hover:border-slate-700/60 transition-all duration-300 ${isCdlAlert ? 'text-red-500 font-extrabold' : 'text-slate-400'}`}>
                        <div className="flex items-center space-x-1.5">
                          {isCdlAlert && <AlertCircle size={12} className="text-red-505 text-red-500 animate-pulse" />}
                          <span>{d.license_expiry_date}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-400 bg-slate-900/25 border-t border-b border-slate-800/80 group-hover:bg-slate-800/25 group-hover:border-slate-700/60 transition-all duration-300">
                        {d.license_category}
                      </td>
                      <td className="p-4 bg-slate-900/25 border-t border-b border-slate-800/80 group-hover:bg-slate-800/25 group-hover:border-slate-700/60 transition-all duration-300">
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800/80">
                            <div className={`h-full ${
                              d.safety_score >= 90 ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' :
                              d.safety_score >= 80 ? 'bg-violet-500 shadow-[0_0_8px_#8b5cf6]' : 
                              'bg-orange-500 shadow-[0_0_8px_#f97316]'
                            }`} style={{ width: `${d.safety_score}%` }}></div>
                          </div>
                          <span className={`font-extrabold font-mono ${scoreColor}`}>{d.safety_score}%</span>
                        </div>
                      </td>
                      <td className="p-4 bg-slate-900/25 border-t border-b border-slate-800/80 group-hover:bg-slate-800/25 group-hover:border-slate-700/60 transition-all duration-300">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-extrabold border ${
                          d.status === 'AVAILABLE' ? 'border-emerald-500/20 bg-emerald-950/20 text-emerald-400' :
                          d.status === 'ON_TRIP' ? 'border-blue-550/20 bg-blue-950/20 text-blue-400' :
                          d.status === 'SUSPENDED' ? 'border-red-500/25 bg-red-950/25 text-red-400' :
                          'border-amber-500/20 bg-amber-950/20 text-amber-400'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                            d.status === 'AVAILABLE' ? 'bg-emerald-400 animate-pulse' :
                            d.status === 'ON_TRIP' ? 'bg-blue-400 animate-pulse' :
                            d.status === 'SUSPENDED' ? 'bg-red-400 shadow-[0_0_4px_#ef4444]' :
                            'bg-amber-400'
                          }`} />
                          {d.status === 'ON_TRIP' ? 'ON DUTY' : d.status}
                        </span>
                      </td>
                      <td className="p-4 pr-6 bg-slate-900/25 border-t border-b last:border-r border-slate-800/80 last:rounded-r-2xl group-hover:bg-slate-800/25 group-hover:border-slate-700/60 transition-all duration-300 text-right">
                        <div className="flex justify-end space-x-1.5">
                          {/* Compliance Clear button */}
                          {(d.status === 'SUSPENDED' || d.notes === 'Training Enrolled' || isCdlAlert) && (
                            <button
                              onClick={() => handleClearCompliance(d.id, d.name)}
                              className="flex items-center space-x-1 rounded-lg border border-emerald-500/30 bg-emerald-950/40 hover:bg-emerald-500 hover:text-white px-2.5 py-1 text-[10px] font-extrabold text-emerald-400 transition-all duration-200 active:scale-95 cursor-pointer shadow-sm shadow-emerald-950/20"
                              title="Clear compliance flags"
                            >
                              <CheckCircle2 size={11} />
                              <span>Compliance Clear</span>
                            </button>
                          )}

                          {/* Flag Course */}
                          {d.safety_score < 80 && d.notes !== 'Training Enrolled' && (
                            <button
                              onClick={() => handleAssignTraining(d.id, d.name)}
                              className="flex items-center space-x-1 rounded-lg border border-orange-500/30 bg-orange-950/40 hover:bg-orange-500 hover:text-white px-2.5 py-1 text-[10px] font-extrabold text-orange-400 transition-all duration-200 active:scale-95 cursor-pointer shadow-sm shadow-orange-950/20"
                              title="Assign driver to refresher training course"
                            >
                              <GraduationCap size={11} />
                              <span>Flag Course</span>
                            </button>
                          )}

                          {/* Suspend Operator */}
                          {d.status !== 'SUSPENDED' && (d.safety_score < 80 || isCdlAlert) && (
                            <button
                              onClick={() => handleSuspendDriver(d.id, d.name)}
                              className="flex items-center space-x-1 rounded-lg border border-red-500/30 bg-red-950/40 hover:bg-red-500 hover:text-white px-2.5 py-1 text-[10px] font-extrabold text-red-400 transition-all duration-200 active:scale-95 cursor-pointer shadow-sm shadow-red-950/20"
                              title="Suspend operator"
                            >
                              <AlertTriangle size={11} />
                              <span>Suspend</span>
                            </button>
                          )}

                          {/* Normal Status */}
                          {d.status === 'AVAILABLE' && d.safety_score >= 80 && !isCdlAlert && (
                            <span className="text-[10px] text-slate-500 font-semibold italic flex items-center space-x-1">
                              <CheckCircle2 size={10} className="text-emerald-500" />
                              <span>Clear</span>
                            </span>
                          )}
                          {d.status === 'ON_TRIP' && d.safety_score >= 80 && !isCdlAlert && (
                            <span className="text-[10px] text-slate-500 font-semibold italic flex items-center space-x-1">
                              <Activity size={10} className="text-violet-500" />
                              <span>On Duty</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER 2: DRIVER DASHBOARD
  // ==========================================
  if (user.role === 'DRIVER') {
    const myDriversProfile = drivers.find(d => d.name.toLowerCase().includes('dave') || d.name.toLowerCase().includes(user.name.toLowerCase())) || drivers[0];
    const myActiveTripCount = kpis.activeTrips; // Simulated active

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-2">
            <Activity className="text-violet-500" />
            <span>Driver Dispatch Console</span>
          </h1>
          <p className="text-slate-400 text-sm">Review route sheets, log odometer values, and check safety scores</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="glass-panel p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">My Safety Score</p>
              <h3 className="text-2xl font-extrabold text-violet-400">{myDriversProfile?.safety_score || 92}%</h3>
              <p className="text-[9px] text-slate-500">Good standing score</p>
            </div>
            <div className="rounded-xl bg-violet-950/40 p-3 border border-violet-850/30 text-violet-450">
              <ShieldCheck size={20} />
            </div>
          </div>

          <div className="glass-panel p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Assigned Routes</p>
              <h3 className="text-2xl font-extrabold text-orange-400">{myActiveTripCount} Scheduled</h3>
              <p className="text-[9px] text-slate-500">Active trip dispatching</p>
            </div>
            <div className="rounded-xl bg-orange-950/40 p-3 border border-orange-850/30 text-orange-400">
              <Map size={20} />
            </div>
          </div>

          <div className="glass-panel p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">License Expiry</p>
              <h3 className="text-2xl font-extrabold text-amber-400">Valid</h3>
              <p className="text-[9px] text-slate-500">Expires: {myDriversProfile?.license_expiry_date || '2028-12-31'}</p>
            </div>
            <div className="rounded-xl bg-amber-950/40 p-3 border border-amber-850/30 text-amber-400">
              <CalendarDays size={20} />
            </div>
          </div>

          <div className="glass-panel p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Duty Status</p>
              <h3 className="text-2xl font-extrabold text-emerald-450 text-emerald-450">{myDriversProfile?.status || 'AVAILABLE'}</h3>
              <p className="text-[9px] text-slate-500">Currently logged status</p>
            </div>
            <div className="rounded-xl bg-emerald-950/40 p-3 border border-emerald-850/30 text-emerald-400">
              <Activity size={20} />
            </div>
          </div>
        </div>

        {/* Assigned Dispatch sheet */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <FileSpreadsheet className="text-orange-400" size={18} />
            <h3 className="text-sm font-bold text-slate-200">My Assigned Route Sheet</h3>
          </div>
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/10">
            <Map className="mx-auto text-slate-600 mb-2" size={32} />
            <p className="text-xs text-slate-400 font-semibold">No active routes dispatched directly to your vehicle profile.</p>
            <p className="text-[10px] text-slate-500 mt-1">Please report to dispatch hub to schedule routes or check standard schedules.</p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER 3: FINANCIAL ANALYST DASHBOARD
  // ==========================================
  if (user.role === 'FINANCIAL_ANALYST') {
    const totalExpenses = costBreakdown.reduce((sum, e) => sum + e.value, 0);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-2">
            <DollarSign className="text-emerald-450 text-emerald-500" />
            <span>Financial & Expenses Ledger</span>
          </h1>
          <p className="text-slate-400 text-sm">Review vehicle expenditures, fuel transaction audits, and ROI charts</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="glass-panel p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Gross Expenditures</p>
              <h3 className="text-2xl font-extrabold text-emerald-400">${totalExpenses.toLocaleString()}</h3>
              <p className="text-[9px] text-slate-500">Tolls, repairs, and fuel</p>
            </div>
            <div className="rounded-xl bg-emerald-950/40 p-3 border border-emerald-850/30 text-emerald-400">
              <DollarSign size={20} />
            </div>
          </div>

          <div className="glass-panel p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Fuel Total</p>
              <h3 className="text-2xl font-extrabold text-orange-400">
                ${costBreakdown.find(c => c.name.toLowerCase() === 'fuel')?.value.toLocaleString() || '18,240'}
              </h3>
              <p className="text-[9px] text-slate-500">Fleet gasoline purchasing</p>
            </div>
            <div className="rounded-xl bg-orange-950/40 p-3 border border-orange-850/30 text-orange-400">
              <Activity size={20} />
            </div>
          </div>

          <div className="glass-panel p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Fix & Maintenance Cost</p>
              <h3 className="text-2xl font-extrabold text-violet-400">
                ${costBreakdown.find(c => c.name.toLowerCase() === 'maintenance')?.value.toLocaleString() || '11,400'}
              </h3>
              <p className="text-[9px] text-slate-500">Service workshop billing</p>
            </div>
            <div className="rounded-xl bg-violet-950/40 p-3 border border-violet-850/30 text-violet-400">
              <Wrench size={20} />
            </div>
          </div>

          <div className="glass-panel p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Tolls & Other Costs</p>
              <h3 className="text-2xl font-extrabold text-amber-400">
                ${costBreakdown.find(c => c.name.toLowerCase() === 'toll')?.value.toLocaleString() || '2,120'}
              </h3>
              <p className="text-[9px] text-slate-500">Road and highway tolls</p>
            </div>
            <div className="rounded-xl bg-amber-950/40 p-3 border border-amber-850/30 text-amber-400">
              <FileSpreadsheet size={20} />
            </div>
          </div>
        </div>

        {/* Operating Cost Breakdown */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200">Expense Allocations</h3>
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={costBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                    {costBreakdown.map((_, idx) => <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${value}`, 'Cost']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200">Historical Operational Expenditures</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={utilizationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUtil" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={9} />
                  <YAxis stroke="#94a3b8" fontSize={9} />
                  <Tooltip />
                  <Area type="monotone" dataKey="utilizationRate" stroke="#f97316" fillOpacity={1} fill="url(#colorUtil)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER 4: FLEET MANAGER DASHBOARD (Enhanced Space Theme)
  // ==========================================
  // Filtered vehicles count and list
  const filteredVehicles = vehicles.filter(v => {
    const matchesRegion = !selectedRegion || v.region?.toLowerCase() === selectedRegion.toLowerCase();
    const matchesStatus = !selectedStatus || v.status === selectedStatus;
    const matchesType = !selectedType || v.type.toLowerCase().includes(selectedType.toLowerCase());
    return matchesRegion && matchesStatus && matchesType;
  });

  const regions = Array.from(new Set(vehicles.map(v => v.region).filter(Boolean)));
  const types = Array.from(new Set(vehicles.map(v => v.type)));

  return (
    <div className="relative -m-6 md:-m-8 p-6 md:p-8 space-y-6 overflow-hidden rounded-2xl min-h-[calc(100vh-4rem)]" style={{
      background: 'radial-gradient(ellipse at bottom, #1a1a2e 0%, #0f0f1a 100%)',
    }}>
      {/* Parallax Stars Layers */}
      <div className="safety-stars-layer animate-stars-slow" style={{ width: '1px', height: '1px', boxShadow: starShadows.slow }} />
      <div className="safety-stars-layer animate-stars-medium" style={{ width: '2px', height: '2px', boxShadow: starShadows.medium }} />
      <div className="safety-stars-layer animate-stars-fast" style={{ width: '3px', height: '3px', boxShadow: starShadows.fast }} />

      {/* Content Wrapper to render on top of stars */}
      <div className="relative z-10 space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start md:items-center">
            <div className="p-2.5 rounded-2xl bg-blue-950/40 border border-blue-500/20 text-blue-400 mr-4 shadow-[0_0_20px_rgba(59,130,246,0.15)] flex-shrink-0">
              <Activity size={28} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent" style={{ filter: 'drop-shadow(0 2px 8px rgba(59,130,246,0.15))' }}>
                Fleet Operations Command
              </h1>
              <p className="text-slate-400 text-xs md:text-sm font-medium tracking-wide mt-1">
                Real-time fleet tracking, utilization metrics, and vehicle performance analytics
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced KPI Stats Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1 - Fleet Utilization */}
          <div className="uiverse-card-blue h-full cursor-default">
            <div className="uiverse-card-inner h-full p-6 flex items-center justify-between relative overflow-hidden group bg-gradient-to-br from-blue-500/5 to-slate-950/90">
              <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-blue-500/10 blur-xl group-hover:bg-blue-500/20 transition-all duration-500" />
              <div className="space-y-2 relative z-10">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fleet Utilization</p>
                <h3 className="text-3xl font-extrabold text-blue-400 glow-text-blue" style={{ textShadow: '0 0 10px rgba(59,130,246,0.3)' }}>{kpis.fleetUtilizationPct}%</h3>
                <p className="text-[10px] text-slate-500">Active vs Total vehicles</p>
              </div>
              <div className="rounded-2xl bg-blue-950/40 p-4 border border-blue-850/30 text-blue-400 group-hover:border-blue-500/50 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300 relative z-10">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>

          {/* Card 2 - Active Trips */}
          <div className="uiverse-card-cyan h-full cursor-default">
            <div className="uiverse-card-inner h-full p-6 flex items-center justify-between relative overflow-hidden group bg-gradient-to-br from-cyan-500/5 to-slate-950/90">
              <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-cyan-500/10 blur-xl group-hover:bg-cyan-500/20 transition-all duration-500" />
              <div className="space-y-2 relative z-10">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Trips</p>
                <h3 className="text-3xl font-extrabold text-cyan-400" style={{ textShadow: '0 0 10px rgba(34,211,238,0.3)' }}>{kpis.activeTrips}</h3>
                <p className="text-[10px] text-slate-500">{kpis.pendingTrips} in draft queue</p>
              </div>
              <div className="rounded-2xl bg-cyan-950/40 p-4 border border-cyan-850/30 text-cyan-400 group-hover:border-cyan-500/50 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all duration-300 relative z-10">
                <Map size={24} />
              </div>
            </div>
          </div>

          {/* Card 3 - In Service Bay */}
          <div className="uiverse-card-amber h-full cursor-default">
            <div className="uiverse-card-inner h-full p-6 flex items-center justify-between relative overflow-hidden group bg-gradient-to-br from-amber-500/5 to-slate-950/90">
              <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-amber-500/10 blur-xl group-hover:bg-amber-500/20 transition-all duration-500" />
              <div className="space-y-2 relative z-10">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">In Service Bay</p>
                <h3 className="text-3xl font-extrabold text-amber-400" style={{ textShadow: '0 0 10px rgba(245,158,11,0.3)' }}>{kpis.inMaintenance}</h3>
                <p className="text-[10px] text-slate-500">Vehicles in workshop</p>
              </div>
              <div className="rounded-2xl bg-amber-950/40 p-4 border border-amber-850/30 text-amber-400 group-hover:border-amber-500/50 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all duration-300 relative z-10">
                <Wrench size={24} />
              </div>
            </div>
          </div>

          {/* Card 4 - Drivers on Trip */}
          <div className="uiverse-card-rose h-full cursor-default">
            <div className="uiverse-card-inner h-full p-6 flex items-center justify-between relative overflow-hidden group bg-gradient-to-br from-rose-500/5 to-slate-950/90">
              <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-rose-500/10 blur-xl group-hover:bg-rose-500/20 transition-all duration-500" />
              <div className="space-y-2 relative z-10">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Drivers on Trip</p>
                <h3 className="text-3xl font-extrabold text-rose-400" style={{ textShadow: '0 0 10px rgba(244,63,94,0.3)' }}>{kpis.driversOnDuty}</h3>
                <p className="text-[10px] text-slate-500">Active operators</p>
              </div>
              <div className="rounded-2xl bg-rose-950/40 p-4 border border-rose-850/30 text-rose-400 group-hover:border-rose-500/50 group-hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all duration-300 relative z-10">
                <Users size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Interactive Filters Panel */}
        <div className="glass-panel p-6 border border-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.08)]">
          <div className="flex items-center space-x-2 mb-4">
            <SlidersHorizontal size={16} className="text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-200">Quick Vehicle Filter Matrix</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Region</label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:shadow-[0_0_10px_rgba(59,130,246,0.2)] focus:outline-none transition-all duration-200"
              >
                <option value="">All Regions</option>
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Vehicle Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:shadow-[0_0_10px_rgba(59,130,246,0.2)] focus:outline-none transition-all duration-200"
              >
                <option value="">All Statuses</option>
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="ON_TRIP">ON TRIP</option>
                <option value="IN_SHOP">IN SHOP</option>
                <option value="RETIRED">RETIRED</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Body Class / Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:shadow-[0_0_10px_rgba(59,130,246,0.2)] focus:outline-none transition-all duration-200"
              >
                <option value="">All Types</option>
                {types.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Live Filter Summary */}
          <div className="mt-4 flex items-center justify-between border-t border-slate-800/60 pt-4 text-xs text-slate-400">
            <span>Matching fleet vehicles: <strong className="text-blue-400">{filteredVehicles.length}</strong></span>
            {(selectedRegion || selectedStatus || selectedType) && (
              <button 
                onClick={() => { setSelectedRegion(''); setSelectedStatus(''); setSelectedType(''); }}
                className="text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-200"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Enhanced Charts section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Utilization trend chart */}
          <div className="glass-panel p-6 lg:col-span-2 space-y-4 border border-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.08)]">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Historical Fleet Utilization</h3>
              <p className="text-[11px] text-slate-400">Average active usage percent over the past 7 days</p>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={utilizationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUtilFleet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <filter id="glowFleet" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#3b82f6', borderRadius: '12px', borderWidth: 1 }}
                    labelStyle={{ color: '#f1f5f9', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="utilizationRate" 
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorUtilFleet)" 
                    name="Utilization Rate"
                    filter="url(#glowFleet)"
                    dot={{
                      fill: '#0f172a',
                      stroke: '#3b82f6',
                      strokeWidth: 2,
                      r: 4
                    }}
                    activeDot={{
                      fill: '#3b82f6',
                      stroke: '#ffffff',
                      strokeWidth: 1.5,
                      r: 6
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cost breakdown pie chart */}
          <div className="glass-panel p-6 space-y-4 border border-cyan-500/10 shadow-[0_0_30px_rgba(34,211,238,0.08)]">
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
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#22d3ee', borderRadius: '12px', borderWidth: 1 }}
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
                    <div className="h-2 w-2 rounded-full shadow-[0_0_6px_currentColor]" style={{ backgroundColor: COLORS[idx % COLORS.length], color: COLORS[idx % COLORS.length] }}></div>
                    <span className="text-slate-400 truncate">{entry.name}:</span>
                    <span className="text-slate-200 font-semibold">${entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filtered Vehicles List */}
        <div className="glass-panel overflow-hidden border border-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.08)]">
          <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200">Live Vehicle Fleet Status</h3>
            <span className="rounded-full bg-blue-950/40 border border-blue-500/20 px-2.5 py-0.5 text-xs text-blue-400 font-semibold">Filtered: {filteredVehicles.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-separate border-spacing-y-2.5">
              <thead>
                <tr className="text-slate-400 font-extrabold uppercase tracking-wider text-[9px]">
                  <th className="p-3 pl-6">Reg Number</th>
                  <th className="p-3">Vehicle Model</th>
                  <th className="p-3">Region</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Odometer</th>
                  <th className="p-3">Max Capacity</th>
                  <th className="p-3 pr-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center">
                      <div className="p-8 border border-dashed border-slate-800 rounded-xl bg-slate-900/10">
                        <Activity className="mx-auto text-slate-600 mb-2" size={32} />
                        <p className="text-xs text-slate-400 font-semibold">No vehicles found matching current filter matrix.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map(v => (
                    <tr 
                      key={v.id} 
                      className="group hover:scale-[1.005] transition-all duration-300"
                    >
                      <td className="p-4 pl-6 bg-slate-900/25 border-t border-b first:border-l border-slate-800/80 first:rounded-l-2xl group-hover:bg-slate-800/25 group-hover:border-slate-700/60 transition-all duration-300">
                        <div className="flex items-center">
                          <div className="w-7 h-7 rounded-xl bg-slate-950/70 border border-slate-850 flex items-center justify-center font-extrabold text-blue-400 text-[10px] mr-3 group-hover:border-blue-500/30 group-hover:shadow-[0_0_8px_rgba(59,130,246,0.2)] transition-all duration-300 shadow-inner">
                            {v.registration_no.slice(-3)}
                          </div>
                          <span className="font-extrabold text-slate-200 tracking-wide font-mono">{v.registration_no}</span>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-slate-200 bg-slate-900/25 border-t border-b border-slate-800/80 group-hover:bg-slate-800/25 group-hover:border-slate-700/60 transition-all duration-300">
                        {v.name}
                      </td>
                      <td className="p-4 text-slate-400 bg-slate-900/25 border-t border-b border-slate-800/80 group-hover:bg-slate-800/25 group-hover:border-slate-700/60 transition-all duration-300">
                        {v.region || '—'}
                      </td>
                      <td className="p-4 text-slate-400 bg-slate-900/25 border-t border-b border-slate-800/80 group-hover:bg-slate-800/25 group-hover:border-slate-700/60 transition-all duration-300">
                        {v.type}
                      </td>
                      <td className="p-4 font-mono text-slate-300 bg-slate-900/25 border-t border-b border-slate-800/80 group-hover:bg-slate-800/25 group-hover:border-slate-700/60 transition-all duration-300">
                        {v.odometer.toLocaleString()} km
                      </td>
                      <td className="p-4 font-mono text-slate-400 bg-slate-900/25 border-t border-b border-slate-800/80 group-hover:bg-slate-800/25 group-hover:border-slate-700/60 transition-all duration-300">
                        {(v.max_load_capacity / 1000).toFixed(1)}t
                      </td>
                      <td className="p-4 pr-6 bg-slate-900/25 border-t border-b last:border-r border-slate-800/80 last:rounded-r-2xl group-hover:bg-slate-800/25 group-hover:border-slate-700/60 transition-all duration-300 text-right">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-extrabold border ${
                          v.status === 'AVAILABLE' ? 'border-emerald-500/20 bg-emerald-950/20 text-emerald-400' :
                          v.status === 'ON_TRIP' ? 'border-blue-500/20 bg-blue-950/20 text-blue-400' :
                          v.status === 'IN_SHOP' ? 'border-amber-500/20 bg-amber-950/20 text-amber-400' :
                          'border-slate-600/20 bg-slate-800/20 text-slate-400'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                            v.status === 'AVAILABLE' ? 'bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]' :
                            v.status === 'ON_TRIP' ? 'bg-blue-400 animate-pulse shadow-[0_0_6px_#3b82f6]' :
                            v.status === 'IN_SHOP' ? 'bg-amber-400 animate-pulse shadow-[0_0_6px_#f59e0b]' :
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
