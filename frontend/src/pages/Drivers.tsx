// src/pages/Drivers.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiClient } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import type { Driver } from '../api/mockDb';
import { Search, Plus, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';

const driverSchema = z.object({
  name: z.string().min(3, 'Driver full name is required'),
  license_number: z.string().min(5, 'License number is required'),
  license_category: z.string().min(2, 'License category is required'),
  license_expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiry date must be in YYYY-MM-DD format'),
  contact_number: z.string().min(6, 'Valid contact number is required'),
  safety_score: z.number().min(0, 'Safety score must be between 0 and 100').max(100, 'Safety score must be between 0 and 100'),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED'] as const)
});

type DriverFormValues = z.infer<typeof driverSchema>;

export const Drivers: React.FC = () => {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [formError, setFormError] = useState('');

  const isSafetyOfficer = user?.role === 'SAFETY_OFFICER';

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      name: '',
      license_number: '',
      license_category: 'Class A CDL',
      license_expiry_date: '',
      contact_number: '',
      safety_score: 100,
      status: 'AVAILABLE'
    }
  });

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.drivers.list();
      setDrivers(res.data);
    } catch (err) {
      console.error('Failed to fetch drivers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const openAddModal = () => {
    setEditingDriver(null);
    setFormError('');
    reset({
      name: '',
      license_number: '',
      license_category: 'Class A CDL',
      license_expiry_date: '',
      contact_number: '',
      safety_score: 100,
      status: 'AVAILABLE'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (driver: Driver) => {
    setEditingDriver(driver);
    setFormError('');
    reset({
      name: driver.name,
      license_number: driver.license_number,
      license_category: driver.license_category,
      license_expiry_date: driver.license_expiry_date,
      contact_number: driver.contact_number,
      safety_score: driver.safety_score,
      status: driver.status
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (values: DriverFormValues) => {
    setFormError('');
    try {
      if (editingDriver) {
        await apiClient.drivers.update(editingDriver.id, values);
      } else {
        await apiClient.drivers.create(values);
      }
      setIsModalOpen(false);
      fetchDrivers();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Failed to save driver.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this driver?')) return;
    try {
      await apiClient.drivers.delete(id);
      fetchDrivers();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Delete failed.');
    }
  };

  const getLicenseExpiryInfo = (expiryStr: string) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const expiry = new Date(expiryStr);
    expiry.setHours(0,0,0,0);
    
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { status: 'EXPIRED', color: 'text-red-500 bg-red-950/20 border-red-500/30' };
    } else if (diffDays <= 30) {
      return { status: `EXPIRES IN ${diffDays} DAYS`, color: 'text-amber-500 bg-amber-950/20 border-amber-500/30' };
    }
    return { status: 'VALID', color: 'text-slate-400 border-transparent' };
  };

  const filtered = drivers.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || 
                          d.license_number.toLowerCase().includes(search.toLowerCase()) ||
                          d.contact_number.includes(search);
    const matchesStatus = !statusFilter || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Driver Directory</h1>
          <p className="text-slate-400 text-sm">Oversee fleet operators, license credentials, and safety performance</p>
        </div>
        {isSafetyOfficer && (
          <button
            onClick={openAddModal}
            className="flex items-center space-x-2 px-4 py-2.5 text-xs btn-gradient"
          >
            <Plus size={16} />
            <span>Add Driver</span>
          </button>
        )}
      </div>

      {/* Expiry alerts banner */}
      {drivers.some(d => getLicenseExpiryInfo(d.license_expiry_date).status !== 'VALID') && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-950/10 p-4 text-xs flex items-start space-x-3">
          <AlertTriangle size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-amber-400">License Expiration Warnings</h4>
            <p className="text-slate-400 mt-1">Some assigned operators have licenses that are expired or expiring within 30 days. Action is required by the safety officer.</p>
          </div>
        </div>
      )}

      {/* Search Header */}
      <div className="glass-panel p-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, license ID, contact..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/60 pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-orange-500 focus:outline-none transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs text-slate-300 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="AVAILABLE">AVAILABLE</option>
          <option value="ON_TRIP">ON TRIP</option>
          <option value="OFF_DUTY">OFF DUTY</option>
          <option value="SUSPENDED">SUSPENDED</option>
        </select>
      </div>

      {/* Main Table */}
      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-slate-400 text-xs">Accessing operator registry...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/30 text-slate-400 font-bold">
                  <th className="p-4">Name</th>
                  <th className="p-4">License Number</th>
                  <th className="p-4">License Category</th>
                  <th className="p-4">License Expiry</th>
                  <th className="p-4">Contact Number</th>
                  <th className="p-4">Safety Score</th>
                  <th className="p-4">Status</th>
                  {isSafetyOfficer && <th className="p-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 font-medium">
                      No drivers found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map(d => {
                    const expiryInfo = getLicenseExpiryInfo(d.license_expiry_date);
                    return (
                      <tr key={d.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="p-4 font-semibold text-slate-200">{d.name}</td>
                        <td className="p-4 font-mono text-slate-400">{d.license_number}</td>
                        <td className="p-4 text-slate-400">{d.license_category}</td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className={`font-mono ${expiryInfo.status !== 'VALID' ? 'text-red-400 font-bold' : 'text-slate-300'}`}>
                              {d.license_expiry_date}
                            </span>
                            {expiryInfo.status !== 'VALID' && (
                              <span className={`mt-1 inline-block rounded-md border px-1.5 py-0.5 text-[9px] font-bold w-fit ${expiryInfo.color}`}>
                                {expiryInfo.status}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-mono text-slate-300">{d.contact_number}</td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-slate-800 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  d.safety_score >= 90 ? 'bg-emerald-500' :
                                  d.safety_score >= 70 ? 'bg-amber-500' : 'bg-red-500'
                                }`} 
                                style={{ width: `${d.safety_score}%` }}
                              />
                            </div>
                            <span className={`font-mono font-bold ${
                              d.safety_score >= 90 ? 'text-emerald-400' :
                              d.safety_score >= 70 ? 'text-amber-400' : 'text-red-400'
                            }`}>
                              {d.safety_score}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                            d.status === 'AVAILABLE' ? 'border-emerald-500/20 bg-emerald-950/20 text-emerald-400' :
                            d.status === 'ON_TRIP' ? 'border-blue-500/20 bg-blue-950/20 text-blue-400' :
                            d.status === 'OFF_DUTY' ? 'border-slate-700/20 bg-slate-800/20 text-slate-400' :
                            'border-red-500/20 bg-red-950/20 text-red-400'
                          }`}>
                            <span className={`mr-1 h-1.5 w-1.5 rounded-full ${
                              d.status === 'AVAILABLE' ? 'bg-emerald-400 pulse-dot' :
                              d.status === 'ON_TRIP' ? 'bg-blue-400 pulse-dot' :
                              d.status === 'OFF_DUTY' ? 'bg-slate-400' :
                              'bg-red-400 pulse-dot'
                            }`} />
                            {d.status}
                          </span>
                        </td>
                        {isSafetyOfficer && (
                          <td className="p-4 text-right">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => openEditModal(d)}
                                className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200"
                                title="Edit Driver Details"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => handleDelete(d.id)}
                                className="p-1.5 rounded-lg border border-red-900/30 bg-red-950/20 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                                title="Remove Driver"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
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
                {editingDriver ? 'Edit Operator Credentials' : 'Enroll New Operator'}
              </h3>
              <p className="text-[11px] text-slate-400">Fill driver qualifications and licensing records</p>
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
                  <label className="font-semibold text-slate-400">Full Name</label>
                  <input
                    type="text"
                    {...register('name')}
                    placeholder="e.g. John Doe"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                  {errors.name && <p className="text-[10px] text-red-400">{errors.name.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Contact Number</label>
                  <input
                    type="text"
                    {...register('contact_number')}
                    placeholder="e.g. +1 (555) 019-3829"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                  {errors.contact_number && <p className="text-[10px] text-red-400">{errors.contact_number.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">License ID Number</label>
                  <input
                    type="text"
                    {...register('license_number')}
                    placeholder="e.g. DL-88912-A"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                  {errors.license_number && <p className="text-[10px] text-red-400">{errors.license_number.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">License Category</label>
                  <select
                    {...register('license_category')}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    <option value="Class A CDL">Class A CDL</option>
                    <option value="Class B CDL">Class B CDL</option>
                    <option value="Class C Commercial">Class C Commercial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">License Expiry (YYYY-MM-DD)</label>
                  <input
                    type="text"
                    {...register('license_expiry_date')}
                    placeholder="2028-12-31"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                  {errors.license_expiry_date && <p className="text-[10px] text-red-400">{errors.license_expiry_date.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-400">Safety Rating Score (0-100)</label>
                  <input
                    type="number"
                    {...register('safety_score', { valueAsNumber: true })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                  {errors.safety_score && <p className="text-[10px] text-red-400">{errors.safety_score.message}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Duty / Safety Status</label>
                <select
                  {...register('status')}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-orange-500"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="ON_TRIP">ON TRIP</option>
                  <option value="OFF_DUTY">OFF DUTY</option>
                  <option value="SUSPENDED">SUSPENDED</option>
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
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
