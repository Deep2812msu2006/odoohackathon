// src/pages/Maintenance.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiClient } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import type { MaintenanceLog, Vehicle } from '../api/mockDb';
import { Wrench, Plus, CheckCircle, AlertTriangle, Calendar, X, Info } from 'lucide-react';

const maintenanceSchema = z.object({
  vehicle_id: z.string().min(1, 'Vehicle selection is required'),
  description: z.string().min(5, 'Repair description is required'),
  cost: z.number().min(1, 'Cost estimate must be greater than 0')
});

type MaintenanceFormValues = z.infer<typeof maintenanceSchema>;

export const Maintenance: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [availVehicles, setAvailVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState('');

  const isFleetManager = user?.role === 'FLEET_MANAGER';

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      vehicle_id: '',
      description: '',
      cost: 0
    }
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [logsRes, vehiclesRes] = await Promise.all([
        apiClient.maintenance.list(),
        apiClient.vehicles.list()
      ]);
      setLogs(logsRes.data);
      setVehicles(vehiclesRes.data);
    } catch (err) {
      console.error('Failed to load maintenance logs', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableDropdowns = async () => {
    try {
      // Exclude vehicles on trip, in shop, retired
      const res = await apiClient.vehicles.getAvailable();
      setAvailVehicles(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setFormError('');
    reset({
      vehicle_id: '',
      description: '',
      cost: 0
    });
    loadAvailableDropdowns();
    setIsModalOpen(true);
  };

  const onSubmit = async (values: MaintenanceFormValues) => {
    setFormError('');
    try {
      await apiClient.maintenance.open({
        vehicleId: values.vehicle_id,
        description: values.description,
        cost: values.cost
      });
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Failed to open maintenance log.');
    }
  };

  const handleCloseLog = async (id: string) => {
    if (!window.confirm('Close this maintenance file? The vehicle status will revert to AVAILABLE.')) return;
    try {
      await apiClient.maintenance.close(id);
      loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Closing log failed.');
    }
  };

  const getVehicleName = (id: string) => vehicles.find(v => v.id === id)?.name || 'Unknown Vehicle';
  const getVehicleReg = (id: string) => vehicles.find(v => v.id === id)?.registration_no || '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Workshop & Service Logs</h1>
          <p className="text-slate-400 text-sm">Review vehicle repairs, inspections, and active shop work orders</p>
        </div>
        {isFleetManager && (
          <button
            onClick={openAddModal}
            className="flex items-center space-x-2 px-4 py-2.5 text-xs btn-gradient"
          >
            <Plus size={16} />
            <span>Open Maintenance</span>
          </button>
        )}
      </div>

      {/* Info message */}
      <div className="glass-panel p-4 flex items-start space-x-3 text-xs">
        <Info size={18} className="text-cyan-400 mt-0.5 flex-shrink-0" />
        <div className="text-slate-400 leading-normal">
          <span className="font-bold text-slate-200">Lifecycle Logic Rules:</span> Opening a workshop order instantly transitions the vehicle to <span className="text-amber-400 font-semibold font-mono">IN_SHOP</span>, making it unavailable for dispatches. Closing the work order returns it to <span className="text-emerald-400 font-semibold font-mono">AVAILABLE</span>.
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-slate-400 text-xs">Fetching maintenance logs...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/30 text-slate-400 font-bold">
                  <th className="p-4">Vehicle</th>
                  <th className="p-4">Repair Description</th>
                  <th className="p-4">Cost Center</th>
                  <th className="p-4">Service Start</th>
                  <th className="p-4">Service End</th>
                  <th className="p-4">Status</th>
                  {isFleetManager && <th className="p-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                      No workshop records logged.
                    </td>
                  </tr>
                ) : (
                  [...logs].reverse().map(log => (
                    <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-slate-200 font-semibold">{getVehicleName(log.vehicle_id)}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{getVehicleReg(log.vehicle_id)}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-300 max-w-xs truncate" title={log.description}>{log.description}</td>
                      <td className="p-4 font-mono text-slate-300 font-bold">${log.cost.toLocaleString()}</td>
                      <td className="p-4 text-slate-400">
                        <div className="flex items-center space-x-1.5 font-mono text-[10px]">
                          <Calendar size={12} />
                          <span>{new Date(log.started_at).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-400">
                        {log.closed_at ? (
                          <div className="flex items-center space-x-1.5 font-mono text-[10px]">
                            <Calendar size={12} />
                            <span>{new Date(log.closed_at).toLocaleDateString()}</span>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                          log.is_active 
                            ? 'border-amber-500/20 bg-amber-950/20 text-amber-400' 
                            : 'border-slate-700 bg-slate-850 text-slate-400'
                        }`}>
                          <span className={`mr-1 h-1.5 w-1.5 rounded-full ${log.is_active ? 'bg-amber-400 pulse-dot' : 'bg-slate-400'}`} />
                          {log.is_active ? 'ACTIVE WORK' : 'RESOLVED'}
                        </span>
                      </td>
                      {isFleetManager && (
                        <td className="p-4 text-right">
                          {log.is_active && (
                            <button
                              onClick={() => handleCloseLog(log.id)}
                              className="flex ml-auto items-center space-x-1.5 rounded-lg border border-emerald-900/30 bg-emerald-950/20 px-2.5 py-1 text-[10px] font-bold text-emerald-400 hover:bg-emerald-900/20"
                            >
                              <CheckCircle size={12} />
                              <span>Close Log</span>
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Open Log Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-6">
            <button onClick={() => setIsModalOpen(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-200">
              <X size={16} />
            </button>

            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <Wrench size={18} className="text-blue-500" />
                <span>Open Maintenance Work Order</span>
              </h3>
              <p className="text-[11px] text-slate-400">Flags vehicle status as IN_SHOP and registers maintenance cost</p>
            </div>

            {formError && (
              <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-400 flex items-center space-x-2">
                <AlertTriangle size={14} className="flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Select Target Vehicle</label>
                <select
                  {...register('vehicle_id')}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none"
                >
                  <option value="">Choose vehicle...</option>
                  {availVehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.registration_no})
                    </option>
                  ))}
                </select>
                {errors.vehicle_id && <p className="text-[10px] text-red-400">{errors.vehicle_id.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Description of Work / Malfunction</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  placeholder="Describe repair requirements, e.g. replacing transmission seals..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none"
                />
                {errors.description && <p className="text-[10px] text-red-400">{errors.description.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Cost Estimate ($)</label>
                <input
                  type="number"
                  {...register('cost', { valueAsNumber: true })}
                  placeholder="e.g. 500"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none"
                />
                {errors.cost && <p className="text-[10px] text-red-400">{errors.cost.message}</p>}
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary-custom">Cancel</button>
                <button type="submit" className="px-4 py-2.5 btn-gradient">Confirm Repair Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
