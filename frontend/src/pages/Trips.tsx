// src/pages/Trips.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiClient } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import type { Trip, Vehicle, Driver, TripStatus } from '../api/mockDb';
import { 
  Plus, Play, CheckCircle2, XCircle, Milestone, 
  AlertTriangle, Navigation, Info, Fuel, X 
} from 'lucide-react';

const tripSchema = z.object({
  source: z.string().min(2, 'Source is required'),
  destination: z.string().min(2, 'Destination is required'),
  vehicle_id: z.string().min(1, 'Vehicle is required'),
  driver_id: z.string().min(1, 'Driver is required'),
  cargo_weight: z.number().min(1, 'Cargo weight must be greater than 0'),
  planned_distance: z.number().min(1, 'Planned distance must be greater than 0')
});

type TripFormValues = z.infer<typeof tripSchema>;

export const Trips: React.FC = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  
  // Available vehicles/drivers for dropdowns
  const [availVehicles, setAvailVehicles] = useState<Vehicle[]>([]);
  const [availDrivers, setAvailDrivers] = useState<Driver[]>([]);
  
  const [activeTab, setActiveTab] = useState<TripStatus | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  
  const [formError, setFormError] = useState('');
  
  // Completion form inputs
  const [actualDistance, setActualDistance] = useState('');
  const [fuelConsumed, setFuelConsumed] = useState('');
  const [completeError, setCompleteError] = useState('');

  // Selected vehicle for weight check in modal
  const canMutate = user?.role === 'DRIVER' || user?.role === 'FLEET_MANAGER';
  const isDriverOnly = user?.role === 'DRIVER';

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<TripFormValues>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      source: '',
      destination: '',
      vehicle_id: '',
      driver_id: '',
      cargo_weight: 0,
      planned_distance: 0
    }
  });

  // Watch fields for live weight check
  const watchedVehicleId = watch('vehicle_id');
  const watchedCargoWeight = watch('cargo_weight');

  const selectedVehicleObj = availVehicles.find(v => v.id === watchedVehicleId);
  const isOverloaded = selectedVehicleObj && watchedCargoWeight > selectedVehicleObj.max_load_capacity;

  const loadData = async () => {
    try {
      setLoading(true);
      const [tripRes, vehicleRes, driverRes] = await Promise.all([
        apiClient.trips.list(),
        apiClient.vehicles.list(),
        apiClient.drivers.list()
      ]);
      setTrips(tripRes.data);
      setVehicles(vehicleRes.data);
      setDrivers(driverRes.data);
    } catch (err) {
      console.error('Failed to load trips data', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableDropdowns = async () => {
    try {
      const [vRes, dRes] = await Promise.all([
        apiClient.vehicles.getAvailable(),
        apiClient.drivers.getAvailable()
      ]);
      setAvailVehicles(vRes.data);
      setAvailDrivers(dRes.data);
    } catch (err) {
      console.error('Failed to load available resources', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.role]); // Re-load when user switches role (affects driver filtering)

  const openCreateModal = () => {
    setFormError('');
    reset({
      source: '',
      destination: '',
      vehicle_id: '',
      driver_id: '',
      cargo_weight: 0,
      planned_distance: 0
    });
    loadAvailableDropdowns();
    setIsCreateOpen(true);
  };

  const onSubmitCreate = async (values: TripFormValues) => {
    setFormError('');
    
    // Additional validation client-side
    const v = availVehicles.find(item => item.id === values.vehicle_id);
    if (v && values.cargo_weight > v.max_load_capacity) {
      setFormError(`Cargo weight exceeds the chosen vehicle max load capacity of ${v.max_load_capacity.toLocaleString()} kg.`);
      return;
    }

    try {
      await apiClient.trips.create(values);
      setIsCreateOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Failed to dispatch/create trip.');
    }
  };

  const handleDispatch = async (id: string) => {
    if (!window.confirm('Dispatch this vehicle and driver? State turns to ON_TRIP.')) return;
    try {
      await apiClient.trips.dispatch(id);
      loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Dispatch failed.');
    }
  };

  const openCompleteModal = (id: string) => {
    setSelectedTripId(id);
    setActualDistance('');
    setFuelConsumed('');
    setCompleteError('');
    setIsCompleteOpen(true);
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompleteError('');
    if (!selectedTripId) return;

    const d = parseFloat(actualDistance);
    const f = parseFloat(fuelConsumed);

    if (isNaN(d) || d <= 0) {
      setCompleteError('Provide a positive actual distance.');
      return;
    }
    if (isNaN(f) || f <= 0) {
      setCompleteError('Provide positive fuel consumed.');
      return;
    }

    try {
      await apiClient.trips.complete(selectedTripId, { finalOdometer: d, fuelConsumed: f });
      setIsCompleteOpen(false);
      loadData();
    } catch (err: any) {
      setCompleteError(err?.response?.data?.message || 'Completion update failed.');
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Cancel this trip allocation? Driver and vehicle status will be restored.')) return;
    try {
      await apiClient.trips.cancel(id);
      loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Cancel failed.');
    }
  };

  const filteredTrips = trips.filter(t => activeTab === 'ALL' || t.status === activeTab);

  const getVehicleName = (id: string) => vehicles.find(v => v.id === id)?.name || 'Unknown Vehicle';
  const getVehicleReg = (id: string) => vehicles.find(v => v.id === id)?.registration_no || '';
  const getDriverName = (id: string) => drivers.find(d => d.id === id)?.name || 'Unknown Driver';

  const tabStatuses: (TripStatus | 'ALL')[] = ['ALL', 'DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Dispatches & Trips</h1>
          <p className="text-slate-400 text-sm">Schedule routes, assign operators, and monitor real-time dispatches</p>
        </div>
        {canMutate && (
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 px-4 py-2.5 text-xs btn-gradient"
          >
            <Plus size={16} />
            <span>Create Trip</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-4">
        {tabStatuses.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === tab 
                ? 'border-cyan-500 text-cyan-400' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Trips list */}
      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-slate-400 text-xs">Querying trip manifests...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/30 text-slate-400 font-bold">
                  <th className="p-4">Route ID</th>
                  <th className="p-4">Origin / Destination</th>
                  <th className="p-4">Vehicle</th>
                  <th className="p-4">Driver</th>
                  <th className="p-4">Weight Load</th>
                  <th className="p-4">Distance</th>
                  <th className="p-4">Fuel</th>
                  <th className="p-4">Status</th>
                  {isDriverOnly && <th className="p-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTrips.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500 font-medium">
                      No matching trips found in database.
                    </td>
                  </tr>
                ) : (
                  filteredTrips.map(t => (
                    <tr key={t.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-300">#{t.id}</td>
                      <td className="p-4">
                        <div className="flex flex-col space-y-1">
                          <span className="text-slate-200 font-semibold">{t.source}</span>
                          <span className="text-[10px] text-slate-500">to</span>
                          <span className="text-slate-200 font-semibold">{t.destination}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-slate-300">{getVehicleName(t.vehicle_id)}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{getVehicleReg(t.vehicle_id)}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-300">{getDriverName(t.driver_id)}</td>
                      <td className="p-4 font-mono text-slate-400">{(t.cargo_weight / 1000).toFixed(1)}t</td>
                      <td className="p-4">
                        <div className="flex flex-col font-mono text-[11px]">
                          <span className="text-slate-400" title="Planned">Est: {t.planned_distance} km</span>
                          {t.actual_distance && (
                            <span className="text-slate-200" title="Actual">Act: {t.actual_distance} km</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-mono text-slate-300">
                        {t.fuel_consumed ? `${t.fuel_consumed}L` : '—'}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                          t.status === 'DRAFT' ? 'border-slate-700 bg-slate-800 text-slate-400' :
                          t.status === 'DISPATCHED' ? 'border-cyan-500/20 bg-cyan-950/20 text-cyan-400' :
                          t.status === 'COMPLETED' ? 'border-emerald-500/20 bg-emerald-950/20 text-emerald-400' :
                          'border-red-500/20 bg-red-950/20 text-red-400'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      {isDriverOnly && (
                        <td className="p-4 text-right">
                          <div className="flex justify-end space-x-2">
                            {t.status === 'DRAFT' && (
                              <>
                                <button
                                  onClick={() => handleDispatch(t.id)}
                                  className="flex items-center space-x-1 rounded-lg border border-cyan-900/30 bg-cyan-950/20 px-2 py-1 text-[10px] font-bold text-cyan-400 hover:bg-cyan-900/20"
                                >
                                  <Play size={10} />
                                  <span>Dispatch</span>
                                </button>
                                <button
                                  onClick={() => handleCancel(t.id)}
                                  className="flex items-center space-x-1 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-200"
                                >
                                  <XCircle size={10} />
                                  <span>Cancel</span>
                                </button>
                              </>
                            )}
                            {t.status === 'DISPATCHED' && (
                              <>
                                <button
                                  onClick={() => openCompleteModal(t.id)}
                                  className="flex items-center space-x-1 rounded-lg border border-emerald-900/30 bg-emerald-950/20 px-2 py-1 text-[10px] font-bold text-emerald-400 hover:bg-emerald-900/20"
                                >
                                  <CheckCircle2 size={10} />
                                  <span>Complete</span>
                                </button>
                                <button
                                  onClick={() => handleCancel(t.id)}
                                  className="flex items-center space-x-1 rounded-lg border border-red-900/30 bg-red-950/20 px-2 py-1 text-[10px] font-bold text-red-400 hover:bg-red-900/20"
                                >
                                  <XCircle size={10} />
                                  <span>Abrupt Cancel</span>
                                </button>
                              </>
                            )}
                          </div>
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

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-6">
            <button onClick={() => setIsCreateOpen(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-200">
              <X size={16} />
            </button>

            <div>
              <h3 className="text-base font-bold text-slate-100">Schedule New Dispatch</h3>
              <p className="text-[11px] text-slate-400">Establish route parameters, assign operator and vehicle</p>
            </div>

            {formError && (
              <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-400 flex items-center space-x-2">
                <AlertTriangle size={14} className="flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmitCreate)} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Origin Depot</label>
                  <input type="text" {...register('source')} placeholder="e.g. Chicago Hub" className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none" />
                  {errors.source && <p className="text-[10px] text-red-400">{errors.source.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Destination Depot</label>
                  <input type="text" {...register('destination')} placeholder="e.g. Detroit Port" className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none" />
                  {errors.destination && <p className="text-[10px] text-red-400">{errors.destination.message}</p>}
                </div>
              </div>

              {/* Available dropdowns */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Select Available Vehicle</label>
                  <select {...register('vehicle_id')} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none">
                    <option value="">Choose vehicle...</option>
                    {availVehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.registration_no}) - Capacity: {v.max_load_capacity.toLocaleString()}kg
                      </option>
                    ))}
                  </select>
                  {errors.vehicle_id && <p className="text-[10px] text-red-400">{errors.vehicle_id.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Select Available Operator</label>
                  <select {...register('driver_id')} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none">
                    <option value="">Choose driver...</option>
                    {availDrivers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} (Safety: {d.safety_score})
                      </option>
                    ))}
                  </select>
                  {errors.driver_id && <p className="text-[10px] text-red-400">{errors.driver_id.message}</p>}
                </div>
              </div>

              {/* Weight Warnings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Planned Distance (km)</label>
                  <input type="number" {...register('planned_distance', { valueAsNumber: true })} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none" />
                  {errors.planned_distance && <p className="text-[10px] text-red-400">{errors.planned_distance.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Cargo Weight (kg)</label>
                  <input type="number" {...register('cargo_weight', { valueAsNumber: true })} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none" />
                  {errors.cargo_weight && <p className="text-[10px] text-red-400">{errors.cargo_weight.message}</p>}
                </div>
              </div>

              {/* Realtime Overload Warning */}
              {selectedVehicleObj && (
                <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold">
                    <span>Vehicle capacity:</span>
                    <span>{selectedVehicleObj.max_load_capacity.toLocaleString()} kg</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold">
                    <span>Target cargo:</span>
                    <span className={isOverloaded ? 'text-red-400' : 'text-slate-200'}>{watchedCargoWeight.toLocaleString()} kg</span>
                  </div>
                  
                  {isOverloaded && (
                    <div className="flex items-start space-x-2 text-[10px] text-red-400 bg-red-950/20 border border-red-500/20 p-2 rounded-lg">
                      <AlertTriangle size={14} className="flex-shrink-0" />
                      <span>
                        CRITICAL ERROR: Weight exceeds max load capacity by {(watchedCargoWeight - selectedVehicleObj.max_load_capacity).toLocaleString()} kg. This will be blocked on submission.
                      </span>
                    </div>
                  )}
                  {!isOverloaded && watchedCargoWeight > 0 && (
                    <div className="flex items-center space-x-2 text-[10px] text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 p-2 rounded-lg">
                      <Info size={14} className="flex-shrink-0" />
                      <span>Cargo load is safe and within parameters.</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="btn-secondary-custom">Cancel</button>
                <button type="submit" disabled={isOverloaded} className="px-4 py-2.5 btn-gradient disabled:opacity-30">Confirm Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Trip Modal */}
      {isCompleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-6">
            <button onClick={() => setIsCompleteOpen(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-200">
              <X size={16} />
            </button>

            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <Milestone size={18} className="text-emerald-500" />
                <span>Mark Dispatch Completed</span>
              </h3>
              <p className="text-[11px] text-slate-400">Provide final trip metrics to restore vehicle and operator availability</p>
            </div>

            {completeError && (
              <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-400 flex items-center space-x-2">
                <AlertTriangle size={14} className="flex-shrink-0" />
                <span>{completeError}</span>
              </div>
            )}

            <form onSubmit={handleCompleteSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-400 flex items-center">
                  <Navigation size={12} className="mr-1 text-slate-500" />
                  <span>Actual Distance Driven (km)</span>
                </label>
                <input
                  type="number"
                  value={actualDistance}
                  onChange={(e) => setActualDistance(e.target.value)}
                  placeholder="e.g. 285"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-400 flex items-center">
                  <Fuel size={12} className="mr-1 text-slate-500" />
                  <span>Total Fuel Consumed (Liters)</span>
                </label>
                <input
                  type="number"
                  value={fuelConsumed}
                  onChange={(e) => setFuelConsumed(e.target.value)}
                  placeholder="e.g. 98"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none"
                />
                <p className="text-[9px] text-slate-500 leading-normal">
                  Note: Submitting logs will automatically compile a fuel purchase record costing $1.80/L.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setIsCompleteOpen(false)} className="btn-secondary-custom">Cancel</button>
                <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2.5 font-bold text-white shadow-lg">Submit Completion</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
