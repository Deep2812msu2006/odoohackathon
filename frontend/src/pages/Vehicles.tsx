// src/pages/Vehicles.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiClient } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import type { Vehicle } from '../api/mockDb';
import { Search, Plus, Edit2, Trash2, X, SlidersHorizontal, AlertTriangle } from 'lucide-react';

const vehicleSchema = z.object({
  registration_no: z.string().min(3, 'Registration number is required'),
  name: z.string().min(3, 'Vehicle model name is required'),
  type: z.string().min(2, 'Body type is required'),
  max_load_capacity: z.number().min(1, 'Load capacity must be greater than 0'),
  odometer: z.number().min(0, 'Odometer reading cannot be negative'),
  acquisition_cost: z.number().min(1, 'Cost must be greater than 0'),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'] as const),
  region: z.string().min(2, 'Region is required')
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

export const Vehicles: React.FC = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formError, setFormError] = useState('');

  const isFleetManager = user?.role === 'FLEET_MANAGER';

  const { register, handleSubmit, reset, formState: { errors } } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      registration_no: '',
      name: '',
      type: '',
      max_load_capacity: 0,
      odometer: 0,
      acquisition_cost: 0,
      status: 'AVAILABLE',
      region: ''
    }
  });

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await apiClient.vehicles.list();
      setVehicles(res.data);
    } catch (err) {
      console.error('Failed to fetch vehicles', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const openAddModal = () => {
    setEditingVehicle(null);
    setFormError('');
    reset({
      registration_no: '',
      name: '',
      type: '',
      max_load_capacity: 0,
      odometer: 0,
      acquisition_cost: 0,
      status: 'AVAILABLE',
      region: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormError('');
    reset({
      registration_no: vehicle.registration_no,
      name: vehicle.name,
      type: vehicle.type,
      max_load_capacity: vehicle.max_load_capacity,
      odometer: vehicle.odometer,
      acquisition_cost: vehicle.acquisition_cost,
      status: vehicle.status,
      region: vehicle.region || ''
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (values: VehicleFormValues) => {
    setFormError('');
    try {
      if (editingVehicle) {
        await apiClient.vehicles.update(editingVehicle.id, values);
      } else {
        await apiClient.vehicles.create(values);
      }
      setIsModalOpen(false);
      fetchVehicles();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Failed to save vehicle.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await apiClient.vehicles.delete(id);
      fetchVehicles();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Delete failed.');
    }
  };

  const filtered = vehicles.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) || 
                          v.registration_no.toLowerCase().includes(search.toLowerCase()) ||
                          v.type.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Vehicle Registry</h1>
          <p className="text-slate-400 text-sm">Monitor, add, and update fleet vehicles assets</p>
        </div>
        {isFleetManager && (
          <button
            onClick={openAddModal}
            className="flex items-center space-x-2 px-4 py-2.5 text-xs btn-gradient"
          >
            <Plus size={16} />
            <span>Add Vehicle</span>
          </button>
        )}
      </div>

      {/* Filters Header */}
      <div className="glass-panel p-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by reg plate, model name, type..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/60 pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-orange-500 focus:outline-none transition-colors"
          />
        </div>
        <div className="flex items-center space-x-3">
          <SlidersHorizontal size={14} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="ON_TRIP">ON TRIP</option>
            <option value="IN_SHOP">IN SHOP</option>
            <option value="RETIRED">RETIRED</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-slate-400 text-xs">Fetching vehicle registry...</p>
          </div>
        ) : (
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
                  <th className="p-4">Acquisition Cost</th>
                  <th className="p-4">Status</th>
                  {isFleetManager && <th className="p-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500 font-medium">
                      No vehicles found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map(v => (
                    <tr key={v.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-300">{v.registration_no}</td>
                      <td className="p-4 font-semibold text-slate-200">{v.name}</td>
                      <td className="p-4 text-slate-400">{v.region || '—'}</td>
                      <td className="p-4 text-slate-400">{v.type}</td>
                      <td className="p-4 font-mono text-slate-300">{v.odometer.toLocaleString()} km</td>
                      <td className="p-4 font-mono text-slate-400">{(v.max_load_capacity / 1000).toFixed(1)}t</td>
                      <td className="p-4 font-mono text-slate-400">${v.acquisition_cost.toLocaleString()}</td>
                      <td className="p-4">
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
                      {isFleetManager && (
                        <td className="p-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => openEditModal(v)}
                              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200"
                              title="Edit Vehicle"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDelete(v.id)}
                              className="p-1.5 rounded-lg border border-red-900/30 bg-red-950/20 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                              title="Delete Vehicle"
                            >
                              <Trash2 size={12} />
                            </button>
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-6">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-200"
            >
              <X size={16} />
            </button>

            <div>
              <h3 className="text-base font-bold text-slate-100">
                {editingVehicle ? 'Edit Vehicle Details' : 'Register New Fleet Vehicle'}
              </h3>
              <p className="text-[11px] text-slate-400">Provide registration details and specifications</p>
            </div>

            {formError && (
              <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-400 flex items-center space-x-2">
                <AlertTriangle size={14} className="flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Registration Number</label>
                  <input
                    type="text"
                    {...register('registration_no')}
                    placeholder="e.g. TX-4809"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                  {errors.registration_no && <p className="text-[10px] text-red-400">{errors.registration_no.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Model Name</label>
                  <input
                    type="text"
                    {...register('name')}
                    placeholder="e.g. Volvo FH16"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                  {errors.name && <p className="text-[10px] text-red-400">{errors.name.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Body Class / Type</label>
                  <input
                    type="text"
                    {...register('type')}
                    placeholder="e.g. Semi-Truck"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                  {errors.type && <p className="text-[10px] text-red-400">{errors.type.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Operational Region</label>
                  <input
                    type="text"
                    {...register('region')}
                    placeholder="e.g. North"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                  {errors.region && <p className="text-[10px] text-red-400">{errors.region.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Odometer (km)</label>
                  <input
                    type="number"
                    {...register('odometer', { valueAsNumber: true })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                  {errors.odometer && <p className="text-[10px] text-red-400">{errors.odometer.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Capacity (kg)</label>
                  <input
                    type="number"
                    {...register('max_load_capacity', { valueAsNumber: true })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                  {errors.max_load_capacity && <p className="text-[10px] text-red-400">{errors.max_load_capacity.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Cost ($)</label>
                  <input
                    type="number"
                    {...register('acquisition_cost', { valueAsNumber: true })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                  {errors.acquisition_cost && <p className="text-[10px] text-red-400">{errors.acquisition_cost.message}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Vehicle Status</label>
                <select
                  {...register('status')}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-orange-500"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="ON_TRIP">ON TRIP</option>
                  <option value="IN_SHOP">IN SHOP</option>
                  <option value="RETIRED">RETIRED</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary-custom"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 btn-gradient"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
