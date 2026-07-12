// src/pages/Reports.tsx
import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { Download, BarChart2, TrendingUp, DollarSign, Percent, AlertTriangle } from 'lucide-react';

const CustomReportTooltip = ({ active, payload, label, unit }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 px-3.5 border border-slate-800 text-xs shadow-2xl space-y-1.5 backdrop-blur-xl bg-slate-950/95 rounded-xl min-w-[150px]">
        {label && <p className="font-bold text-slate-100 border-b border-slate-800 pb-1 mb-1.5">{label}</p>}
        {payload.map((item: any, index: number) => (
          <div key={index} className="flex items-center justify-between space-x-6">
            <span className="text-slate-400 font-medium">{item.name || 'Value'}:</span>
            <span className="font-mono font-bold text-slate-200">
              {item.value.toLocaleString()}{unit || item.unit || ''}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const Reports: React.FC = () => {
  const { user } = useAuth();
  
  const [fuelEfficiency, setFuelEfficiency] = useState<any[]>([]);
  const [utilization, setUtilization] = useState<any[]>([]);
  const [roiData, setRoiData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const hasAccess = user?.role === 'FLEET_MANAGER' || user?.role === 'FINANCIAL_ANALYST';

  const loadReportData = async () => {
    try {
      setLoading(true);
      const [fuelRes, utilRes, roiRes] = await Promise.all([
        apiClient.reports.fuelEfficiency(),
        apiClient.reports.fleetUtilization(),
        apiClient.reports.vehicleRoi()
      ]);

      setFuelEfficiency(fuelRes.data);
      setUtilization(utilRes.data);
      setRoiData(roiRes.data);
    } catch (err) {
      console.error('Failed to compile audit reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess) {
      loadReportData();
    }
  }, [user?.role]);

  // Client-side CSV export
  const handleExportCSV = () => {
    if (roiData.length === 0) return;

    // Headers
    const headers = [
      'Vehicle Model',
      'Registration',
      'Operating Costs ($)',
      'Simulated Revenue ($)',
      'Net Profit ($)',
      'Acquisition Cost ($)',
      'ROI (%)'
    ];

    // Rows
    const rows = roiData.map(v => [
      `"${v.vehicleName}"`,
      v.registration,
      v.costs,
      v.revenue,
      v.netProfit,
      v.acquisitionCost,
      `${v.roi}%`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `TransitOps_Fleet_ROI_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!hasAccess) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center p-6">
        <div className="max-w-md text-center bg-slate-900/50 border border-slate-800 rounded-2xl p-8 shadow-xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-950/40 border border-amber-500/30 text-amber-400 mb-4">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Access Restricted</h2>
          <p className="mt-2 text-slate-400 text-sm">
            Only the <strong className="text-slate-300">Fleet Manager</strong> or <strong className="text-slate-300">Financial Analyst</strong> possess security clearances to inspect ROI audit metrics and export logs.
          </p>
          <p className="text-xs text-slate-500 mt-4 leading-normal">
            Hint: Use the "Role switcher" in the top bar to toggle role permissions instantly.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-slate-400 text-sm">Compiling financial graphs and ROI logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Performance & ROI Reports</h1>
          <p className="text-slate-400 text-sm">Review vehicle ROI, efficiency audits, and export logistics spreadsheets</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-2 px-4 py-2.5 text-xs btn-gradient"
        >
          <Download size={16} />
          <span>Export CSV Report</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Chart 1: Vehicle ROI */}
        <div className="universe-card space-y-4">
          <div className="corner-elements-3d">
            <span></span><span></span><span></span><span></span>
          </div>
          <div className="flex items-center space-x-2">
            <Percent size={18} className="text-purple-400" />
            <h3 className="text-sm font-bold text-slate-200">Return on Investment (ROI) %</h3>
          </div>
          <p className="text-[11px] text-slate-400">
            Formula: (Net revenue profits / Acquisition capital cost) %
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roiData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="roiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.95}/>
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.25}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4" stroke="#1e293b" vertical={false} strokeOpacity={0.4} />
                <XAxis dataKey="registration" stroke="#4c647b" fontSize={9} axisLine={false} tickLine={false} dy={8} />
                <YAxis stroke="#4c647b" fontSize={9} axisLine={false} tickLine={false} dx={-8} unit="%" />
                <Tooltip content={<CustomReportTooltip unit="%" />} cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 6 }} />
                <Bar dataKey="roi" fill="url(#roiGrad)" stroke="#8b5cf6" strokeWidth={1} radius={[5, 5, 0, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Fuel Efficiency */}
        <div className="universe-card space-y-4">
          <div className="corner-elements-3d">
            <span></span><span></span><span></span><span></span>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp size={18} className="text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-200">Fuel Efficiency Rate (Liters / 100 km)</h3>
          </div>
          <p className="text-[11px] text-slate-400">
            Average fuel consumed per 100 kilometers traveled (lower is more efficient)
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fuelEfficiency} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="fuelEfficiencyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.95}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.25}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4" stroke="#1e293b" vertical={false} strokeOpacity={0.4} />
                <XAxis dataKey="registration" stroke="#4c647b" fontSize={9} axisLine={false} tickLine={false} dy={8} />
                <YAxis stroke="#4c647b" fontSize={9} axisLine={false} tickLine={false} dx={-8} unit="L" />
                <Tooltip content={<CustomReportTooltip unit=" L/100km" />} cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 6 }} />
                <Bar dataKey="fuelEfficiency" fill="url(#fuelEfficiencyGrad)" stroke="#10b981" strokeWidth={1} radius={[5, 5, 0, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Weekly Utilization rate */}
        <div className="universe-card space-y-4">
          <div className="corner-elements-3d">
            <span></span><span></span><span></span><span></span>
          </div>
          <div className="flex items-center space-x-2">
            <BarChart2 size={18} className="text-blue-400" />
            <h3 className="text-sm font-bold text-slate-200">Operational Capacity Rate</h3>
          </div>
          <p className="text-[11px] text-slate-400">Weekly utilization trends across active dispatches</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={utilization} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="utilizationGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.45}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4" stroke="#1e293b" vertical={false} strokeOpacity={0.4} />
                <XAxis dataKey="day" stroke="#4c647b" fontSize={9} axisLine={false} tickLine={false} dy={8} />
                <YAxis stroke="#4c647b" fontSize={9} axisLine={false} tickLine={false} dx={-8} domain={[0, 100]} unit="%" />
                <Tooltip content={<CustomReportTooltip unit="%" />} />
                <Area 
                  type="monotone" 
                  dataKey="utilizationRate" 
                  stroke="#f97316" 
                  strokeWidth={3} 
                  fill="url(#utilizationGrad)"
                  dot={{ r: 4, fill: '#f97316', stroke: '#0f172a', strokeWidth: 2 }} 
                  activeDot={{ r: 6, fill: '#ffedd5', stroke: '#f97316', strokeWidth: 2 }} 
                  name="Utilization" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial table summary */}
        <div className="universe-card space-y-4">
          <div className="corner-elements-3d">
            <span></span><span></span><span></span><span></span>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign size={18} className="text-amber-400" />
            <h3 className="text-sm font-bold text-slate-200">Total Profitability Matrix</h3>
          </div>
          <p className="text-[11px] text-slate-400">Gross stats based on distance traveled ($2.50/km revenue)</p>
          
          <div className="overflow-y-auto max-h-56">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/30 text-slate-400 font-bold">
                  <th className="p-3">Vehicle</th>
                  <th className="p-3 text-right">Revenue</th>
                  <th className="p-3 text-right">Expenses</th>
                  <th className="p-3 text-right text-emerald-400">Net Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {roiData.map(v => (
                  <tr key={v.registration} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3">
                      <p className="font-semibold text-slate-200">{v.vehicleName}</p>
                      <span className="font-mono text-[9px] text-slate-500">{v.registration}</span>
                    </td>
                    <td className="p-3 text-right font-mono text-slate-300">${v.revenue.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-slate-400">${v.costs.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono font-extrabold text-emerald-400 glow-text-emerald">
                      +${v.netProfit.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
