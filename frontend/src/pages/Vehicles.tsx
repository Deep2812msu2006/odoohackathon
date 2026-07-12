// src/pages/Vehicles.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiClient } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import type { Vehicle } from '../api/mockDb';
import { Search, Plus, Edit2, Trash2, X, SlidersHorizontal, AlertTriangle, Truck, Activity, Wrench, ShieldCheck } from 'lucide-react';

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

  // Vehicle KPIs
  const vehicleKPIs = React.useMemo(() => {
    const total = vehicles.length;
    const available = vehicles.filter(v => v.status === 'AVAILABLE').length;
    const onTrip = vehicles.filter(v => v.status === 'ON_TRIP').length;
    const inShop = vehicles.filter(v => v.status === 'IN_SHOP').length;
    const retired = vehicles.filter(v => v.status === 'RETIRED').length;
    return { total, available, onTrip, inShop, retired };
  }, [vehicles]);

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
    <div className="relative -m-6 md:-m-8 p-6 md:p-8 space-y-6 overflow-hidden rounded-2xl min-h-[calc(100vh-4rem)]" style={{
      background: 'radial-gradient(ellipse at bottom, #1e293b 0%, #060a0d 100%)',
    }}>
      {/* Parallax Stars Layers */}
      <div className="safety-stars-layer animate-stars-slow" style={{ width: '1px', height: '1px', boxShadow: starShadows.slow }} />
      <div className="safety-stars-layer animate-stars-medium" style={{ width: '2px', height: '2px', boxShadow: starShadows.medium }} />
      <div className="safety-stars-layer animate-stars-fast" style={{ width: '3px', height: '3px', boxShadow: starShadows.fast }} />

      {/* Content Wrapper */}
      <div className="relative z-10 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start md:items-center">
          <div className="p-2.5 rounded-2xl bg-blue-950/40 border border-blue-500/20 text-blue-400 mr-4 shadow-[0_0_20px_rgba(59,130,246,0.15)] flex-shrink-0">
            <Truck size={28} />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent" style={{ filter: 'drop-shadow(0 2px 8px rgba(59,130,246,0.15))' }}>
              Fleet Vehicle Registry
            </h1>
            <p className="text-slate-400 text-xs md:text-sm font-medium tracking-wide mt-1">
              Monitor, add, and update fleet vehicle assets and specifications
            </p>
          </div>
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

      {/* Vehicle KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="uiverse-card-blue h-full cursor-default">
          <div className="uiverse-card-inner h-full p-6 flex items-center justify-between relative overflow-hidden group bg-gradient-to-br from-blue-500/5 to-slate-950/90">
            <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-blue-500/10 blur-xl group-hover:bg-blue-500/20 transition-all duration-500" />
            <div className="space-y-2 relative z-10">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Fleet</p>
              <h3 className="text-3xl font-extrabold text-blue-400" style={{ textShadow: '0 0 10px rgba(59,130,246,0.3)' }}>{vehicleKPIs.total}</h3>
              <p className="text-[10px] text-slate-500">Registered vehicles</p>
            </div>
            <div className="rounded-2xl bg-blue-950/40 p-4 border border-blue-850/30 text-blue-400 group-hover:border-blue-500/50 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300 relative z-10">
              <Truck size={24} />
            </div>
          </div>
        </div>

        <div className="uiverse-card-emerald h-full cursor-default">
          <div className="uiverse-card-inner h-full p-6 flex items-center justify-between relative overflow-hidden group bg-gradient-to-br from-emerald-500/5 to-slate-950/90">
            <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-emerald-500/10 blur-xl group-hover:bg-emerald-500/20 transition-all duration-500" />
            <div className="space-y-2 relative z-10">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Available</p>
              <h3 className="text-3xl font-extrabold text-emerald-400" style={{ textShadow: '0 0 10px rgba(16,185,129,0.3)' }}>{vehicleKPIs.available}</h3>
              <p className="text-[10px] text-slate-500">Ready for dispatch</p>
            </div>
            <div className="rounded-2xl bg-emerald-950/40 p-4 border border-emerald-850/30 text-emerald-400 group-hover:border-emerald-500/50 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300 relative z-10">
              <ShieldCheck size={24} />
            </div>
          </div>
        </div>

        <div className="uiverse-card-cyan h-full cursor-default">
          <div className="uiverse-card-inner h-full p-6 flex items-center justify-between relative overflow-hidden group bg-gradient-to-br from-cyan-500/5 to-slate-950/90">
            <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-cyan-500/10 blur-xl group-hover:bg-cyan-500/20 transition-all duration-500" />
            <div className="space-y-2 relative z-10">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">On Trip</p>
              <h3 className="text-3xl font-extrabold text-cyan-400" style={{ textShadow: '0 0 10px_rgba(6,182,212,0.3)' }}>{vehicleKPIs.onTrip}</h3>
              <p className="text-[10px] text-slate-500">Currently active</p>
            </div>
            <div className="rounded-2xl bg-cyan-950/40 p-4 border border-cyan-850/30 text-cyan-400 group-hover:border-cyan-500/50 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all duration-300 relative z-10">
              <Activity size={24} />
            </div>
          </div>
        </div>

        <div className="uiverse-card-amber h-full cursor-default">
          <div className="uiverse-card-inner h-full p-6 flex items-center justify-between relative overflow-hidden group bg-gradient-to-br from-amber-500/5 to-slate-950/90">
            <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-amber-500/10 blur-xl group-hover:bg-amber-500/20 transition-all duration-500" />
            <div className="space-y-2 relative z-10">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">In Shop</p>
              <h3 className="text-3xl font-extrabold text-amber-400" style={{ textShadow: '0 0 10px rgba(245,158,11,0.3)' }}>{vehicleKPIs.inShop}</h3>
              <p className="text-[10px] text-slate-500">Under maintenance</p>
            </div>
            <div className="rounded-2xl bg-amber-950/40 p-4 border border-amber-850/30 text-amber-400 group-hover:border-amber-500/50 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all duration-300 relative z-10">
              <Wrench size={24} />
            </div>
          </div>
        </div>
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
            <table className="w-full text-left text-xs border-separate border-spacing-y-2.5">
              <thead>
                <tr className="text-slate-400 font-extrabold uppercase tracking-wider text-[9px]">
                  <th className="p-3 pl-6">Reg Number</th>
                  <th className="p-3">Vehicle Model</th>
                  <th className="p-3">Region</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Odometer</th>
                  <th className="p-3">Max Capacity</th>
                  <th className="p-3">Acquisition Cost</th>
                  <th className="p-3">Status</th>
                  {isFleetManager && <th className="p-3 pr-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500 font-medium">
                      No vehicles found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map(v => (
                    <tr key={v.id} className="group hover:scale-[1.005] transition-all duration-300">
                      <td className="p-4 pl-6 bg-slate-900/25 border-t border-b first:border-l border-slate-800/80 first:rounded-l-2xl group-hover:bg-slate-800/25 group-hover:border-slate-700/60 transition-all duration-300">
                        <div className="flex items-center">
                          <div className="w-7 h-7 rounded-xl bg-slate-950/70 border border-slate-850 flex items-center justify-center font-extrabold text-slate-350 text-[10px] mr-3 group-hover:border-slate-750 group-hover:text-slate-200 transition-all duration-300 shadow-inner">
                            {v.registration_no.slice(0, 2)}
                          </div>
                          <span className="font-mono font-extrabold text-slate-200 tracking-wide">{v.registration_no}</span>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-slate-200 bg-slate-900/25 border-t border-b border-slate-800/80 group-hover:bg-slate-800/25 group-hover:border-slate-700/60 transition-all duration-300">{v.name}</td>
                      <td className="p-4 text-slate-400 bg-slate-900/25 border-t border-b border-slate-800/80 group-hover:bg-slate-800/25 group-hover:border-slate-700/60 transition-all duration-300">{v.region || '—'}</td>
                      <td className="p-4 text-slate-400 bg-slate-900/25 border-t border-b border-slate-800/80 group-hover:bg-slate-800/25 group-hover:border-slate-700/60 transition-all duration-300">{v.type}</td>
                      <td className="p-4 font-mono text-slate-300 bg-slate-900/25 border-t border-b border-slate-800/80 group-hover:bg-slate-800/25 group-hover:border-slate-700/60 transition-all duration-300">{v.odometer.toLocaleString()} km</td>
                      <td className="p-4 font-mono text-slate-400 bg-slate-900/25 border-t border-b border-slate-800/80 group-hover:bg-slate-800/25 group-hover:border-slate-700/60 transition-all duration-300">{(v.max_load_capacity / 1000).toFixed(1)}t</td>
                      <td className="p-4 font-mono text-slate-400 bg-slate-900/25 border-t border-b border-slate-800/80 group-hover:bg-slate-800/25 group-hover:border-slate-700/60 transition-all duration-300">${v.acquisition_cost.toLocaleString()}</td>
                      <td className="p-4 bg-slate-900/25 border-t border-b border-slate-800/80 group-hover:bg-slate-800/25 group-hover:border-slate-700/60 transition-all duration-300">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-extrabold border ${
                          v.status === 'AVAILABLE' ? 'border-emerald-500/30 bg-emerald-950/35 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.12)]' :
                          v.status === 'ON_TRIP' ? 'border-blue-550/30 bg-blue-950/35 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.12)]' :
                          v.status === 'IN_SHOP' ? 'border-amber-500/30 bg-amber-950/35 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.12)]' :
                          'border-slate-600/30 bg-slate-800/35 text-slate-400'
                        }`}>
                          <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                            v.status === 'AVAILABLE' ? 'bg-emerald-400 animate-pulse' :
                            v.status === 'ON_TRIP' ? 'bg-blue-400 animate-pulse' :
                            v.status === 'IN_SHOP' ? 'bg-amber-400 animate-pulse' :
                            'bg-slate-400'
                          }`} />
                          {v.status}
                        </span>
                      </td>
                      {isFleetManager && (
                        <td className="p-4 pr-6 bg-slate-900/25 border-t border-b last:border-r border-slate-800/80 last:rounded-r-2xl group-hover:bg-slate-800/25 group-hover:border-slate-700/60 transition-all duration-300 text-right">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => openEditModal(v)}
                              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all duration-200"
                              title="Edit Vehicle"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDelete(v.id)}
                              className="p-1.5 rounded-lg border border-red-900/30 bg-red-950/20 text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-all duration-200"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md p-6 shadow-[0_0_50px_rgba(59,130,246,0.15)] space-y-6">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X size={16} />
            </button>

            <div>
              <h3 className="text-base font-extrabold text-slate-100 tracking-wide">
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
                  <label className="font-extrabold uppercase tracking-wider text-[10px] text-slate-400">Registration Number</label>
                  <input
                    type="text"
                    {...register('registration_no')}
                    placeholder="e.g. TX-4809"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/50 px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:border-blue-500 focus:shadow-[0_0_10px_rgba(59,130,246,0.2)] focus:outline-none transition-all duration-200"
                  />
                  {errors.registration_no && <p className="text-[10px] text-red-400">{errors.registration_no.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold uppercase tracking-wider text-[10px] text-slate-400">Model Name</label>
                  <input
                    type="text"
                    {...register('name')}
                    placeholder="e.g. Volvo FH16"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/50 px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:border-blue-500 focus:shadow-[0_0_10px_rgba(59,130,246,0.2)] focus:outline-none transition-all duration-200"
                  />
                  {errors.name && <p className="text-[10px] text-red-400">{errors.name.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-extrabold uppercase tracking-wider text-[10px] text-slate-400">Body Class / Type</label>
                  <input
                    type="text"
                    {...register('type')}
                    placeholder="e.g. Semi-Truck"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/50 px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:border-blue-500 focus:shadow-[0_0_10px_rgba(59,130,246,0.2)] focus:outline-none transition-all duration-200"
                  />
                  {errors.type && <p className="text-[10px] text-red-400">{errors.type.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold uppercase tracking-wider text-[10px] text-slate-400">Operational Region</label>
                  <input
                    type="text"
                    {...register('region')}
                    placeholder="e.g. North"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/50 px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:border-blue-500 focus:shadow-[0_0_10px_rgba(59,130,246,0.2)] focus:outline-none transition-all duration-200"
                  />
                  {errors.region && <p className="text-[10px] text-red-400">{errors.region.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-extrabold uppercase tracking-wider text-[10px] text-slate-400">Odometer (km)</label>
                  <input
                    type="number"
                    {...register('odometer', { valueAsNumber: true })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/50 px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:border-blue-500 focus:shadow-[0_0_10px_rgba(59,130,246,0.2)] focus:outline-none transition-all duration-200"
                  />
                  {errors.odometer && <p className="text-[10px] text-red-400">{errors.odometer.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold uppercase tracking-wider text-[10px] text-slate-400">Capacity (kg)</label>
                  <input
                    type="number"
                    {...register('max_load_capacity', { valueAsNumber: true })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/50 px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:border-blue-500 focus:shadow-[0_0_10px_rgba(59,130,246,0.2)] focus:outline-none transition-all duration-200"
                  />
                  {errors.max_load_capacity && <p className="text-[10px] text-red-400">{errors.max_load_capacity.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold uppercase tracking-wider text-[10px] text-slate-400">Cost ($)</label>
                  <input
                    type="number"
                    {...register('acquisition_cost', { valueAsNumber: true })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/50 px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:border-blue-500 focus:shadow-[0_0_10px_rgba(59,130,246,0.2)] focus:outline-none transition-all duration-200"
                  />
                  {errors.acquisition_cost && <p className="text-[10px] text-red-400">{errors.acquisition_cost.message}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold uppercase tracking-wider text-[10px] text-slate-400">Vehicle Status</label>
                <select
                  {...register('status')}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none transition-colors duration-200"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="ON_TRIP">ON TRIP</option>
                  <option value="IN_SHOP">IN SHOP</option>
                  <option value="RETIRED">RETIRED</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2.5 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-700 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 text-xs font-bold text-white btn-gradient shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] active:scale-95 transition-all duration-200"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};
