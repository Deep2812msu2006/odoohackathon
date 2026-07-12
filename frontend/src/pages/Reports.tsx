// src/pages/Reports.tsx
import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell
} from 'recharts';
import { Download, BarChart2, TrendingUp, DollarSign, Percent, AlertTriangle } from 'lucide-react';

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
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-slate-400 text-sm">Compiling financial graphs and ROI logs...</p>
        </div>
      </div>
    );
  }

  const CHART_COLORS = ['#06b6d4', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

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
        <div className="glass-panel p-6 space-y-4">
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
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="registration" stroke="#94a3b8" fontSize={9} />
                <YAxis stroke="#94a3b8" fontSize={9} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }} formatter={(val) => [`${val}%`, 'ROI']} />
                <Bar dataKey="roi" radius={[4, 4, 0, 0]}>
                  {roiData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Fuel Efficiency */}
        <div className="glass-panel p-6 space-y-4">
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
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="registration" stroke="#94a3b8" fontSize={9} />
                <YAxis stroke="#94a3b8" fontSize={9} unit="L" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }} formatter={(val) => [`${val} L/100km`, 'Fuel Rate']} />
                <Bar dataKey="fuelEfficiency" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Weekly Utilization rate */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <BarChart2 size={18} className="text-blue-400" />
            <h3 className="text-sm font-bold text-slate-200">Operational Capacity Rate</h3>
          </div>
          <p className="text-[11px] text-slate-400">Weekly utilization trends across active dispatches</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={utilization} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="utilizationRate" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Utilization" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial table summary */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <DollarSign size={18} className="text-amber-400" />
            <h3 className="text-sm font-bold text-slate-200">Total Profitability Matrix</h3>
          </div>
          <p className="text-[11px] text-slate-400">Gross stats based on distance traveled ($2.50/km revenue)</p>
          
          <div className="overflow-y-auto max-h-56">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/30 text-slate-400 font-bold">
                  <th className="p-2">Vehicle</th>
                  <th className="p-2 text-right">Revenue</th>
                  <th className="p-2 text-right">Expenses</th>
                  <th className="p-2 text-right text-emerald-400">Net Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {roiData.map(v => (
                  <tr key={v.registration} className="hover:bg-slate-900/20">
                    <td className="p-2">
                      <p className="font-semibold text-slate-300">{v.vehicleName}</p>
                      <span className="font-mono text-[9px] text-slate-500">{v.registration}</span>
                    </td>
                    <td className="p-2 text-right font-mono text-slate-300">${v.revenue.toLocaleString()}</td>
                    <td className="p-2 text-right font-mono text-slate-400">${v.costs.toLocaleString()}</td>
                    <td className="p-2 text-right font-mono font-bold text-emerald-400">${v.netProfit.toLocaleString()}</td>
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
