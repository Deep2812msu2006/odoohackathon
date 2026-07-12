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
  AlertTriangle, Navigation, Info, Fuel, X, MapPin, Route 
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

  // Map state
  const [mapZoom, setMapZoom] = useState(1);
  const [mapPan, setMapPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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

  // Map handlers
  const handleZoomIn = () => setMapZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setMapZoom(prev => Math.max(prev - 0.2, 0.5));
  const handleResetView = () => {
    setMapZoom(1);
    setMapPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - mapPan.x, y: e.clientY - mapPan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setMapPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const getVehicleName = (id: string) => vehicles.find(v => v.id === id)?.name || 'Unknown Vehicle';
  const getVehicleReg = (id: string) => vehicles.find(v => v.id === id)?.registration_no || '';
  const getDriverName = (id: string) => drivers.find(d => d.id === id)?.name || 'Unknown Driver';

  const tabStatuses: (TripStatus | 'ALL')[] = ['ALL', 'DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED'];

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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start md:items-center">
            <div className="p-2.5 rounded-2xl bg-orange-950/40 border border-orange-500/20 text-orange-400 mr-4 shadow-[0_0_20px_rgba(249,115,22,0.15)] flex-shrink-0">
              <Navigation size={28} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-orange-400 via-violet-400 to-purple-500 bg-clip-text text-transparent" style={{ filter: 'drop-shadow(0 2px 8px rgba(249,115,22,0.15))' }}>
                Dispatches & Trips
              </h1>
              <p className="text-slate-400 text-xs md:text-sm font-medium tracking-wide mt-1">
                Schedule routes, assign operators, and monitor real-time dispatches
              </p>
            </div>
          </div>
          {canMutate && (
            <button
              onClick={openCreateModal}
              className="flex items-center space-x-2 px-4 py-2.5 text-xs btn-gradient shadow-[0_0_15px_rgba(249,115,22,0.2)] hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-95 transition-all duration-200"
            >
              <Plus size={16} />
              <span>Create Trip</span>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="glass-panel p-1 inline-flex rounded-xl border border-slate-800/60">
          {tabStatuses.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-bold transition-all rounded-lg ${
                activeTab === tab 
                  ? 'bg-gradient-to-r from-orange-500/20 to-violet-500/20 text-orange-400 border border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.15)]' 
                  : 'text slate-400 hover:text-slate-200 hover:bg-slate-800/50'
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
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-slate-400 text-xs">Querying trip manifests...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-separate border-spacing-y-2.5">
              <thead>
                <tr className="text-slate-400 font-extrabold uppercase tracking-wider text-[9px]">
                  <th className="p-3 pl-6">Route ID</th>
                  <th className="p-3">Origin / Destination</th>
                  <th className="p-3">Vehicle</th>
                  <th className="p-3">Driver</th>
                  <th className="p-3">Weight Load</th>
                  <th className="p-3">Distance</th>
                  <th className="p-3">Fuel</th>
                  <th className="p-3">Status</th>
                  {isDriverOnly && <th className="p-3 pr-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredTrips.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500 font-medium">
                      No matching trips found in database.
                    </td>
                  </tr>
                ) : (
                  filteredTrips.map(t => (
                    <tr 
                      key={t.id} 
                      className="group hover:scale-[1.005] transition-all duration-300"
                    >
                      <td className="p-4 pl-6 bg-slate-900/25 border-t border-b first:border-l border-slate-800/80 first:rounded-l-2xl group-hover:bg-slate-800/25 group-hover:border-slate-700/60 transition-all duration-300">
                        <span className="font-extrabold text-slate-200 font-mono tracking-wide">#{t.id}</span>
                      </td>
                      <td className="p-4 bg-slate-900/25 border-t border-b border-slate-800/80 group-hover:bg-slate-800/25 group-hover:border-slate-700/60 transition-all duration-300">
                        <div className="flex flex-col space-y-1">
                          <span className="text-slate-200 font-semibold">{t.source}</span>
                          <span className="text-[10px] text-slate-500">to</span>
                          <span className="text-slate-200 font-semibold">{t.destination}</span>
                        </div>
                      </td>
                      <td className="p-4 bg-slate-900/25 border-t border-b border-slate-800/80 group-hover:bg-slate-800/25 group-hover:border-slate-700/60 transition-all duration-300">
                        <div className="flex flex-col">
                          <span className="text-slate-300">{getVehicleName(t.vehicle_id)}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{getVehicleReg(t.vehicle_id)}</span>
                        </div>
                      </td>
                      <td className="p-4 bg-slate-900/25 border-t border-b border-slate-800/80 group-hover:bg-slate-800/25 group-hover:border-slate-700/60 transition-all duration-300 text-slate-300">
                        {getDriverName(t.driver_id)}
                      </td>
                      <td className="p-4 bg-slate-900/25 border-t border-b border-slate-800/80 group-hover:bg-slate-800/25 group-hover:border-slate-700/60 transition-all duration-300 font-mono text-slate-400">
                        {(t.cargo_weight / 1000).toFixed(1)}t
                      </td>
                      <td className="p-4 bg-slate-900/25 border-t border-b border-slate-800/80 group-hover:bg-slate-800/25 group-hover:border-slate-700/60 transition-all duration-300">
                        <div className="flex flex-col font-mono text-[11px]">
                          <span className="text-slate-400" title="Planned">Est: {t.planned_distance} km</span>
                          {t.actual_distance && (
                            <span className="text-slate-200" title="Actual">Act: {t.actual_distance} km</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 bg-slate-900/25 border-t border-b border-slate-800/80 group-hover:bg-slate-800/25 group-hover:border-slate-700/60 transition-all duration-300 font-mono text-slate-300">
                        {t.fuel_consumed ? `${t.fuel_consumed}L` : '—'}
                      </td>
                      <td className="p-4 bg-slate-900/25 border-t border-b border-slate-800/80 group-hover:bg-slate-800/25 group-hover:border-slate-700/60 transition-all duration-300">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-extrabold border ${
                          t.status === 'DRAFT' ? 'border-slate-700 bg-slate-800 text-slate-400' :
                          t.status === 'DISPATCHED' ? 'border-orange-500/30 bg-orange-950/35 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.12)]' :
                          t.status === 'COMPLETED' ? 'border-emerald-500/30 bg-emerald-950/35 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.12)]' :
                          'border-red-500/30 bg-red-950/35 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.12)]'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                            t.status === 'DISPATCHED' ? 'bg-orange-400 animate-pulse' :
                            t.status === 'COMPLETED' ? 'bg-emerald-400' :
                            t.status === 'DRAFT' ? 'bg-slate-500' : 'bg-red-400'
                          }`} />
                          {t.status}
                        </span>
                      </td>
                      {isDriverOnly && (
                        <td className="p-4 pr-6 bg-slate-900/25 border-t border-b last:border-r border-slate-800/80 last:rounded-r-2xl group-hover:bg-slate-800/25 group-hover:border-slate-700/60 transition-all duration-300 text-right">
                          <div className="flex justify-end space-x-2">
                            {t.status === 'DRAFT' && (
                              <>
                                <button
                                  onClick={() => handleDispatch(t.id)}
                                  className="flex items-center space-x-1 rounded-lg border border-orange-500/30 bg-orange-950/40 hover:bg-orange-500 hover:text-white px-2.5 py-1 text-[10px] font-extrabold text-orange-400 transition-all duration-200 active:scale-95 cursor-pointer shadow-sm shadow-orange-950/20"
                                >
                                  <Play size={11} />
                                  <span>Dispatch</span>
                                </button>
                                <button
                                  onClick={() => handleCancel(t.id)}
                                  className="flex items-center space-x-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[10px] font-bold text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all duration-200"
                                >
                                  <XCircle size={11} />
                                  <span>Cancel</span>
                                </button>
                              </>
                            )}
                            {t.status === 'DISPATCHED' && (
                              <>
                                <button
                                  onClick={() => openCompleteModal(t.id)}
                                  className="flex items-center space-x-1 rounded-lg border border-emerald-500/30 bg-emerald-950/40 hover:bg-emerald-500 hover:text-white px-2.5 py-1 text-[10px] font-extrabold text-emerald-400 transition-all duration-200 active:scale-95 cursor-pointer shadow-sm shadow-emerald-950/20"
                                >
                                  <CheckCircle2 size={11} />
                                  <span>Complete</span>
                                </button>
                                <button
                                  onClick={() => handleCancel(t.id)}
                                  className="flex items-center space-x-1 rounded-lg border border-red-500/30 bg-red-950/40 hover:bg-red-500 hover:text-white px-2.5 py-1 text-[10px] font-extrabold text-red-400 transition-all duration-200 active:scale-95 cursor-pointer shadow-sm shadow-red-950/20"
                                >
                                  <XCircle size={11} />
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

      {/* Interactive Route Map */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Route className="text-orange-500" size={20} />
            <h3 className="text-sm font-bold text-slate-200">Live Route Visualization</h3>
          </div>
          <div className="flex items-center space-x-4 text-[10px]">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              <span className="text-slate-400">Active</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-slate-400">Completed</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-500"></span>
              <span className="text-slate-400">Draft</span>
            </div>
          </div>
        </div>
        <div className="relative h-[500px] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner">
          {/* Map Background Image */}
          <img 
            src="/cyber_map.png" 
            alt="Cyber Map" 
            className="absolute inset-0 w-full h-full object-cover opacity-25" 
          />
          {/* Map Background Grid */}
          <div className="absolute inset-0 opacity-10 mix-blend-overlay" style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.2) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.2) 1px, transparent 1px)
            `,
            backgroundSize: '30px 30px'
          }}></div>

          {/* Zoom Controls */}
          <div className="absolute top-4 right-4 z-20 flex flex-col space-y-2">
            <button
              onClick={handleZoomIn}
              className="w-8 h-8 rounded-lg bg-slate-800/80 backdrop-blur-sm border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-md"
              title="Zoom In"
            >
              <span className="text-lg font-bold">+</span>
            </button>
            <button
              onClick={handleZoomOut}
              className="w-8 h-8 rounded-lg bg-slate-800/80 backdrop-blur-sm border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-md"
              title="Zoom Out"
            >
              <span className="text-lg font-bold">−</span>
            </button>
            <button
              onClick={handleResetView}
              className="w-8 h-8 rounded-lg bg-slate-800/80 backdrop-blur-sm border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-md"
              title="Reset View"
            >
              <span className="text-xs font-bold">⟲</span>
            </button>
          </div>

          {/* Zoom Level Indicator */}
          <div className="absolute top-4 left-4 z-20 bg-slate-800/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-slate-700 shadow-md">
            <span className="text-[10px] text-slate-400 font-semibold">Zoom: {Math.round(mapZoom * 100)}%</span>
          </div>

          {/* Map Container with Pan and Zoom */}
          <div
            className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div
              className="absolute inset-0 transition-transform duration-75 ease-out"
              style={{
                transform: `translate(${mapPan.x}px, ${mapPan.y}px) scale(${mapZoom})`,
                transformOrigin: 'center center',
                width: '100%',
                height: '100%'
              }}
            >
              {/* Route Lines */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 500" style={{ zIndex: 1 }}>
                {filteredTrips.slice(0, 12).map((trip, index) => {
                  const startXVal = 100 + (index % 4) * 200;
                  const startYVal = 75 + Math.floor(index / 4) * 125;
                  const endXVal = startXVal + 350 + (index % 3) * 100;
                  const endYVal = startYVal + (index % 2 === 0 ? 125 : -75);
                  
                  const controlX = (startXVal + endXVal) / 2 + (index % 2 === 0 ? 30 : -30);
                  const controlY = (startYVal + endYVal) / 2 + (index % 2 === 0 ? -60 : 60);
                  const pathData = `M ${startXVal} ${startYVal} Q ${controlX} ${controlY} ${endXVal} ${endYVal}`;
                  
                  const color = trip.status === 'DISPATCHED' ? '#f97316' :
                               trip.status === 'COMPLETED' ? '#10b981' : '#64748b';
                  
                  return (
                    <g key={trip.id}>
                      {/* Curved glowing path */}
                      <path
                        d={pathData}
                        fill="none"
                        stroke={color}
                        strokeWidth={trip.status === 'DISPATCHED' ? '3' : '2'}
                        strokeDasharray={trip.status === 'DRAFT' ? '6,6' : '0'}
                        className={trip.status === 'DISPATCHED' ? 'transition-all duration-300' : ''}
                        style={{ 
                          opacity: trip.status === 'DISPATCHED' ? 0.9 : 0.45,
                          filter: trip.status === 'DISPATCHED' ? `drop-shadow(0 0 4px ${color})` : 'none'
                        }}
                      />
                      
                      {/* Start point dot */}
                      <circle
                        cx={startXVal}
                        cy={startYVal}
                        r="3.5"
                        fill={color}
                        style={{ opacity: 0.8 }}
                      />
                      
                      {/* End point dot */}
                      <circle
                        cx={endXVal}
                        cy={endYVal}
                        r="3.5"
                        fill={color}
                        style={{ opacity: 0.8 }}
                      />

                      {/* Moving active vehicle dot */}
                      {trip.status === 'DISPATCHED' && (
                        <circle r="4" fill="#ffffff" className="filter drop-shadow-[0_0_6px_#f97316]">
                          <animateMotion
                            dur={`${7 + (index % 3) * 3}s`}
                            repeatCount="indefinite"
                            path={pathData}
                          />
                        </circle>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Location Markers */}
              <div className="absolute inset-0" style={{ zIndex: 2 }}>
                {filteredTrips.slice(0, 12).map((trip, index) => {
                  const startXVal = 100 + (index % 4) * 200;
                  const startYVal = 75 + Math.floor(index / 4) * 125;
                  const endXVal = startXVal + 350 + (index % 3) * 100;
                  const endYVal = startYVal + (index % 2 === 0 ? 125 : -75);
                  
                  return (
                    <React.Fragment key={trip.id}>
                      {/* Origin Marker */}
                      <div
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                        style={{ left: `${startXVal / 10}%`, top: `${startYVal / 5}%` }}
                      >
                        <div className="relative flex items-center justify-center">
                          {trip.status === 'DISPATCHED' && (
                            <span className="absolute inline-flex h-6 w-6 rounded-full bg-orange-500/20 animate-ping" />
                          )}
                          <MapPin 
                            size={16} 
                            className={trip.status === 'DISPATCHED' ? 'text-orange-500 animate-bounce relative z-10' : 'text-slate-400 relative z-10'} 
                          />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-950/90 border border-slate-800 text-[9px] font-bold text-slate-200 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none shadow-xl z-30">
                            <span className="text-slate-500 font-medium mr-1">From:</span>{trip.source}
                          </div>
                        </div>
                      </div>
                      
                      {/* Destination Marker */}
                      <div
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                        style={{ left: `${endXVal / 10}%`, top: `${endYVal / 5}%` }}
                      >
                        <div className="relative flex items-center justify-center">
                          {trip.status === 'DISPATCHED' && (
                            <span className="absolute inline-flex h-6 w-6 rounded-full bg-orange-500/10 animate-ping" />
                          )}
                          <MapPin 
                            size={16} 
                            className={trip.status === 'COMPLETED' ? 'text-emerald-500 relative z-10' : 'text-slate-500 relative z-10'} 
                          />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-950/90 border border-slate-800 text-[9px] font-bold text-slate-200 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none shadow-xl z-30">
                            <span className="text-slate-500 font-medium mr-1">To:</span>{trip.destination}
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div></div>

            {/* Map Legend */}
            <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-sm rounded-lg px-4 py-3 border border-slate-700 z-20">
              <div className="text-[10px] text-slate-400 space-y-2">
                <div className="flex items-center space-x-2">
                  <MapPin size={12} className="text-orange-500" />
                  <span>Active Routes: {filteredTrips.filter(t => t.status === 'DISPATCHED').length}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin size={12} className="text-emerald-500" />
                  <span>Completed: {filteredTrips.filter(t => t.status === 'COMPLETED').length}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin size={12} className="text-slate-500" />
                  <span>Draft: {filteredTrips.filter(t => t.status === 'DRAFT').length}</span>
                </div>
              </div>
            </div>
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
    </div>
  );
};
