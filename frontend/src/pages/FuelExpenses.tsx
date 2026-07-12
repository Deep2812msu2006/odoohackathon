// src/pages/FuelExpenses.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiClient } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import type { Vehicle, FuelLog, Expense } from '../api/mockDb';
import { DollarSign, Fuel, Plus, AlertTriangle, X } from 'lucide-react';

const fuelSchema = z.object({
  vehicle_id: z.string().min(1, 'Vehicle is required'),
  liters: z.number().min(1, 'Liters must be greater than 0'),
  cost: z.number().min(1, 'Cost must be greater than 0')
});

const expenseSchema = z.object({
  vehicle_id: z.string().min(1, 'Vehicle is required'),
  type: z.enum(['toll', 'maintenance', 'other']),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  notes: z.string().optional()
});

type FuelFormValues = z.infer<typeof fuelSchema>;
type ExpenseFormValues = z.infer<typeof expenseSchema>;

export const FuelExpenses: React.FC = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal triggers
  const [isFuelOpen, setIsFuelOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  
  const [fuelError, setFuelError] = useState('');
  const [expenseError, setExpenseError] = useState('');

  const isFinancialAnalyst = user?.role === 'FINANCIAL_ANALYST';

  const { register: regFuel, handleSubmit: handleFuelSubmit, reset: resetFuel, formState: { errors: fuelErrors } } = useForm<FuelFormValues>({
    resolver: zodResolver(fuelSchema)
  });

  const { register: regExpense, handleSubmit: handleExpenseSubmit, reset: resetExpense, formState: { errors: expenseErrors } } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema)
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [vRes, fRes, eRes] = await Promise.all([
        apiClient.vehicles.list(),
        apiClient.fuelLogs.list(),
        apiClient.expenses.list()
      ]);
      setVehicles(vRes.data);
      setFuelLogs(fRes.data);
      setExpenses(eRes.data);
    } catch (err) {
      console.error('Failed to load ledger records', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onFuelSubmit = async (values: FuelFormValues) => {
    setFuelError('');
    try {
      await apiClient.fuelLogs.create(values);
      setIsFuelOpen(false);
      resetFuel();
      loadData();
    } catch (err: any) {
      setFuelError(err?.response?.data?.message || 'Failed to submit fuel log.');
    }
  };

  const onExpenseSubmit = async (values: ExpenseFormValues) => {
    setExpenseError('');
    try {
      await apiClient.expenses.create({
        ...values,
        notes: values.notes || ''
      });
      setIsExpenseOpen(false);
      resetExpense();
      loadData();
    } catch (err: any) {
      setExpenseError(err?.response?.data?.message || 'Failed to submit expense record.');
    }
  };

  const getVehicleName = (id: string) => vehicles.find(v => v.id === id)?.name || 'Unknown Vehicle';
  const getVehicleReg = (id: string) => vehicles.find(v => v.id === id)?.registration_no || '';

  // Compute aggregated costs per vehicle
  const aggregatedStats = vehicles.map(v => {
    // Accumulate fuel logs costs
    const vFuelCost = fuelLogs.filter(f => f.vehicle_id === v.id).reduce((sum, f) => sum + f.cost, 0);
    // Accumulate other expenses
    const vExpenseCost = expenses.filter(e => e.vehicle_id === v.id).reduce((sum, e) => sum + e.amount, 0);
    
    return {
      id: v.id,
      name: v.name,
      registration: v.registration_no,
      fuelCost: vFuelCost,
      expenseCost: vExpenseCost,
      totalCost: vFuelCost + vExpenseCost
    };
  }).sort((a,b) => b.totalCost - a.totalCost);

  // Combine fuel and expenses into a single timeline ledger
  const ledgerTimeline = [
    ...fuelLogs.map(f => ({
      id: f.id,
      vehicle_id: f.vehicle_id,
      date: f.date,
      type: 'Fuel Purchase',
      category: 'fuel',
      amount: f.cost,
      details: `${f.liters} Liters filled`
    })),
    ...expenses.map(e => ({
      id: e.id,
      vehicle_id: e.vehicle_id,
      date: e.date,
      type: `Expense: ${e.type.toUpperCase()}`,
      category: e.type,
      amount: e.amount,
      details: e.notes || 'No description'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getBadgeStyles = (category: string) => {
    switch (category.toLowerCase()) {
      case 'fuel':
        return {
          pill: 'bg-blue-950/20 text-blue-400 border border-blue-500/20',
          dot: 'bg-blue-400 pulse-dot'
        };
      case 'maintenance':
        return {
          pill: 'bg-amber-950/20 text-amber-400 border border-amber-500/20',
          dot: 'bg-amber-400 pulse-dot'
        };
      case 'toll':
        return {
          pill: 'bg-purple-950/20 text-purple-400 border border-purple-500/20',
          dot: 'bg-purple-400 pulse-dot'
        };
      default:
        return {
          pill: 'bg-slate-800/20 text-slate-400 border border-slate-700/20',
          dot: 'bg-slate-400'
        };
    }
  };

  const maxTotalCost = Math.max(...aggregatedStats.map(s => s.totalCost), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Fleet Ledger & Expenses</h1>
          <p className="text-slate-400 text-sm">Track fuel transaction audits, highway tolls, and operation costs</p>
        </div>
        {isFinancialAnalyst && (
          <div className="flex space-x-2">
            <button
              onClick={() => { setFuelError(''); setIsFuelOpen(true); }}
              className="flex items-center space-x-2 px-4 py-2.5 text-xs btn-gradient"
            >
              <Fuel size={16} />
              <span>Log Fuel fill</span>
            </button>
            <button
              onClick={() => { setExpenseError(''); setIsExpenseOpen(true); }}
              className="flex items-center space-x-2 px-4 py-2.5 text-xs btn-secondary-custom"
            >
              <Plus size={16} />
              <span>Record Expense</span>
            </button>
          </div>
        )}
      </div>

      {/* Aggregate Stats per vehicle */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="universe-card space-y-4 h-fit">
          <div className="corner-elements-3d">
            <span></span><span></span><span></span><span></span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">Cost Center Per Vehicle</h3>
            <p className="text-[11px] text-slate-400">Summed fuel + maintenance + toll expenses</p>
          </div>
          <div className="space-y-4 pt-1">
            {loading ? (
              <div className="h-20 flex items-center justify-center text-slate-500 text-xs">Computing statistics...</div>
            ) : aggregatedStats.length === 0 ? (
              <p className="text-xs text-slate-500 text-center">No vehicle data available.</p>
            ) : (
              aggregatedStats.slice(0, 5).map(stat => {
                const fuelPct = stat.totalCost > 0 ? (stat.fuelCost / stat.totalCost) * 100 : 0;
                const expensePct = stat.totalCost > 0 ? (stat.expenseCost / stat.totalCost) * 100 : 0;
                const relativeWidthPct = (stat.totalCost / maxTotalCost) * 100;
                
                return (
                  <div key={stat.id} className="rounded-xl bg-slate-900/30 p-3.5 border border-slate-800/60 space-y-3 hover:border-slate-700/65 transition-colors">
                    <div className="flex justify-between items-start text-xs">
                      <div>
                        <p className="font-semibold text-slate-200">{stat.name}</p>
                        <span className="font-mono text-[9px] text-slate-500">{stat.registration}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-300">${stat.totalCost.toLocaleString()}</span>
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex" style={{ width: `${Math.max(relativeWidthPct, 15)}%` }}>
                        <div className="bg-blue-500 h-full" style={{ width: `${fuelPct}%` }} title={`Fuel: ${Math.round(fuelPct)}%`} />
                        <div className="bg-amber-500 h-full" style={{ width: `${expensePct}%` }} title={`Expenses: ${Math.round(expensePct)}%`} />
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500">
                        <span>Fuel: {Math.round(fuelPct)}%</span>
                        <span>Other: {Math.round(expensePct)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Ledger table */}
        <div className="universe-card lg:col-span-2 space-y-4">
          <div className="corner-elements-3d">
            <span></span><span></span><span></span><span></span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">Recent Operational Ledger Entries</h3>
            <p className="text-[11px] text-slate-400">Chronological history of fuel logs and invoices</p>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-500 text-xs">Fetching ledger details...</div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/30 text-slate-400 font-bold">
                    <th className="p-3">Date</th>
                    <th className="p-3">Vehicle</th>
                    <th className="p-3">Activity Type</th>
                    <th className="p-3">Details / Reference</th>
                    <th className="p-3 text-right">Cost Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {ledgerTimeline.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">No transactions recorded.</td>
                    </tr>
                  ) : (
                    ledgerTimeline.map((item, idx) => {
                      const badge = getBadgeStyles(item.category);
                      return (
                        <tr key={item.id + idx} className="hover:bg-slate-900/40 transition-colors">
                          <td className="p-3 text-slate-400 font-mono text-[10px]">
                            {new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-3">
                            <p className="font-semibold text-slate-200">{getVehicleName(item.vehicle_id)}</p>
                            <span className="font-mono text-[9px] text-slate-500">{getVehicleReg(item.vehicle_id)}</span>
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold ${badge.pill}`}>
                              <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                              {item.type}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400 italic max-w-xs truncate" title={item.details}>{item.details}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-200">${item.amount.toLocaleString()}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Fuel fill log Modal */}
      {isFuelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-6 shadow-2xl space-y-6 overflow-hidden">
            <div className="corner-elements-3d">
              <span></span><span></span><span></span><span></span>
            </div>
            
            <button onClick={() => setIsFuelOpen(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-200 z-10">
              <X size={16} />
            </button>

            <div className="z-10 relative">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <Fuel size={18} className="text-emerald-400" />
                <span>Log Fuel Fill Purchase</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Registers fuel volume and cost metrics against vehicle ledger</p>
            </div>

            {fuelError && (
              <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-400 flex items-center space-x-2 z-10 relative">
                <AlertTriangle size={14} />
                <span>{fuelError}</span>
              </div>
            )}

            <form onSubmit={handleFuelSubmit(onFuelSubmit)} className="space-y-4 text-xs z-10 relative">
              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Vehicle</label>
                <select {...regFuel('vehicle_id')} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all duration-200">
                  <option value="">Select vehicle...</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.registration_no})</option>)}
                </select>
                {fuelErrors.vehicle_id && <p className="text-[10px] text-red-400">{fuelErrors.vehicle_id.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Liters Loaded</label>
                  <input type="number" {...regFuel('liters', { valueAsNumber: true })} placeholder="e.g. 150" className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all duration-200" />
                  {fuelErrors.liters && <p className="text-[10px] text-red-400">{fuelErrors.liters.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Total Bill Cost ($)</label>
                  <input type="number" {...regFuel('cost', { valueAsNumber: true })} placeholder="e.g. 270" className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all duration-200" />
                  {fuelErrors.cost && <p className="text-[10px] text-red-400">{fuelErrors.cost.message}</p>}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setIsFuelOpen(false)} className="btn-secondary-custom">Cancel</button>
                <button type="submit" className="px-4 py-2.5 btn-gradient">Register Receipt</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {isExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-6 shadow-2xl space-y-6 overflow-hidden">
            <div className="corner-elements-3d">
              <span></span><span></span><span></span><span></span>
            </div>
            
            <button onClick={() => setIsExpenseOpen(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-200 z-10">
              <X size={16} />
            </button>

            <div className="z-10 relative">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <DollarSign size={18} className="text-orange-500" />
                <span>Log General Expense Voucher</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Registers tolls, other costs or assets related expenses</p>
            </div>

            {expenseError && (
              <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-400 flex items-center space-x-2 z-10 relative">
                <AlertTriangle size={14} />
                <span>{expenseError}</span>
              </div>
            )}

            <form onSubmit={handleExpenseSubmit(onExpenseSubmit)} className="space-y-4 text-xs z-10 relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Target Vehicle</label>
                  <select {...regExpense('vehicle_id')} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all duration-200">
                    <option value="">Select vehicle...</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.registration_no})</option>)}
                  </select>
                  {expenseErrors.vehicle_id && <p className="text-[10px] text-red-400">{expenseErrors.vehicle_id.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Expense Category</label>
                  <select {...regExpense('type')} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all duration-200">
                    <option value="toll">Highway Toll</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="other">Other Supplies</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Invoice / Bill Amount ($)</label>
                <input type="number" {...regExpense('amount', { valueAsNumber: true })} placeholder="e.g. 50" className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all duration-200" />
                {expenseErrors.amount && <p className="text-[10px] text-red-400">{expenseErrors.amount.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Notes / Details</label>
                <input type="text" {...regExpense('notes')} placeholder="e.g. Toll booth receipts for Route-I90" className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all duration-200" />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setIsExpenseOpen(false)} className="btn-secondary-custom">Cancel</button>
                <button type="submit" className="px-4 py-2.5 btn-gradient">Confirm Voucher</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
