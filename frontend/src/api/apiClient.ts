// src/api/apiClient.ts
import { db } from './mockDb';
import type { User, Vehicle, Driver, Trip, FuelLog, Expense, Role } from './mockDb';

// Utility to delay executions (simulating network latency)
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Retrieve user from sessionStorage to simulate Auth
const getAuthUser = (): User | null => {
  const userStr = sessionStorage.getItem('to_auth_user');
  if (!userStr) return null;
  const user = JSON.parse(userStr);
  if (user && user.role) {
    user.role = user.role.replace(' ', '_');
  }
  return user;
};

// Check if user has permission
const checkRole = (allowedRoles: Role[]) => {
  const user = getAuthUser();
  if (!user) throw { response: { status: 401, data: { message: 'Unauthorized' } } };
  if (!allowedRoles.includes(user.role)) {
    throw { response: { status: 403, data: { message: 'Forbidden' } } };
  }
};

export const apiClient = {
  auth: {
    login: async (email: string, password_hash: string, role: string) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: password_hash, role })
      });
      const data = await response.json();
      if (!response.ok) {
        throw { response: { status: response.status, data } };
      }
      sessionStorage.setItem('to_auth_user', JSON.stringify(data.user));
      sessionStorage.setItem('to_token', data.token);
      return { data };
    },
    
    register: async (name: string, email: string, password_hash: string, confirm_password: string, role: string) => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: password_hash, confirmPassword: confirm_password, role })
      });
      const data = await response.json();
      if (!response.ok) {
        throw { response: { status: response.status, data } };
      }
      return { data };
    },

    verifyRegistration: async (email: string, otp: string) => {
      const response = await fetch('/api/auth/verify-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await response.json();
      if (!response.ok) {
        throw { response: { status: response.status, data } };
      }
      sessionStorage.setItem('to_auth_user', JSON.stringify(data.user));
      sessionStorage.setItem('to_token', data.token);
      return { data };
    },

    me: async () => {
      const user = getAuthUser();
      if (!user) {
        throw { response: { status: 401, data: { message: 'Not authenticated' } } };
      }
      return { data: user };
    },

    logout: async () => {
      sessionStorage.removeItem('to_auth_user');
      sessionStorage.removeItem('to_token');
      return { data: { success: true } };
    }
  },

  vehicles: {
    list: async (filters?: { status?: string; type?: string; region?: string }) => {
      try {
        const response = await fetch('/api/vehicles');
        let list = await response.json();
        
        // Map _id to id for the frontend
        list = list.map((v: any) => ({ ...v, id: v._id }));

        if (filters?.status) {
          list = list.filter((v: any) => v.status === filters.status);
        }
        if (filters?.type) {
          list = list.filter((v: any) => v.type.toLowerCase().includes(filters.type!.toLowerCase()));
        }
        if (filters?.region) {
          list = list.filter((v: any) => v.region?.toLowerCase() === filters.region!.toLowerCase());
        }
        return { data: list };
      } catch (e) {
        console.error('Failed to fetch from backend, falling back to mock data', e);
        return { data: [] };
      }
    },

    getAvailable: async () => {
      await delay(200);
      return { data: db.getAvailableVehicles() };
    },

    get: async (id: string) => {
      await delay(200);
      const v = db.getVehicles().find(v => v.id === id);
      if (!v) throw { response: { status: 404, data: { message: 'Vehicle not found' } } };
      return { data: v };
    },

    create: async (vehicleData: Omit<Vehicle, 'id' | 'created_at'>) => {
      try {
        const response = await fetch('/api/vehicles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(vehicleData)
        });
        if (!response.ok) throw new Error('Failed to create vehicle');
        let saved = await response.json();
        saved = { ...saved, id: saved._id };
        return { data: saved };
      } catch (err: any) {
        throw { response: { status: 400, data: { message: err.message } } };
      }
    },

    update: async (id: string, vehicleData: Partial<Vehicle>) => {
      try {
        const response = await fetch(`/api/vehicles/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(vehicleData)
        });
        if (!response.ok) throw new Error('Failed to update vehicle');
        let saved = await response.json();
        saved = { ...saved, id: saved._id };
        return { data: saved };
      } catch (err: any) {
        throw { response: { status: 400, data: { message: err.message } } };
      }
    },

    delete: async (id: string) => {
      try {
        const response = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete vehicle');
        return { data: { success: true } };
      } catch (err: any) {
        throw { response: { status: 400, data: { message: err.message } } };
      }
    }
  },

  drivers: {
    list: async (filters?: { status?: string }) => {
      try {
        const response = await fetch('/api/drivers');
        let list = await response.json();
        list = list.map((d: any) => ({ ...d, id: d._id }));

        if (filters?.status) {
          list = list.filter((d: any) => d.status === filters.status);
        }
        return { data: list };
      } catch (e) {
        console.error('Failed to fetch from backend, falling back to mock data', e);
        return { data: [] };
      }
    },

    getAvailable: async () => {
      await delay(200);
      return { data: db.getAvailableDrivers() };
    },

    get: async (id: string) => {
      await delay(200);
      const d = db.getDrivers().find(d => d.id === id);
      if (!d) throw { response: { status: 404, data: { message: 'Driver not found' } } };
      return { data: d };
    },

    create: async (driverData: Omit<Driver, 'id' | 'created_at'>) => {
      try {
        const response = await fetch('/api/drivers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(driverData)
        });
        if (!response.ok) throw new Error('Failed to create driver');
        let saved = await response.json();
        saved = { ...saved, id: saved._id };
        return { data: saved };
      } catch (err: any) {
        throw { response: { status: 400, data: { message: err.message } } };
      }
    },

    update: async (id: string, driverData: Partial<Driver>) => {
      try {
        const response = await fetch(`/api/drivers/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(driverData)
        });
        if (!response.ok) throw new Error('Failed to update driver');
        let saved = await response.json();
        saved = { ...saved, id: saved._id };
        return { data: saved };
      } catch (err: any) {
        throw { response: { status: 400, data: { message: err.message } } };
      }
    },

    delete: async (id: string) => {
      try {
        const response = await fetch(`/api/drivers/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete driver');
        return { data: { success: true } };
      } catch (err: any) {
        throw { response: { status: 400, data: { message: err.message } } };
      }
    }
  },

  trips: {
    list: async (filters?: { status?: string }) => {
      try {
        const response = await fetch('/api/trips');
        let list = await response.json();
        list = list.map((t: any) => ({ ...t, id: t._id }));
        
        if (filters?.status) {
          list = list.filter((t: any) => t.status === filters.status);
        }
        
        // Filter by driver if user is a Driver
        const user = getAuthUser();
        if (user && user.role === 'DRIVER') {
          // Attempting to match driver. Normally we'd do this via real Driver ID linked to user.
          // For now, if driver name matches user name.
          try {
             const drRes = await fetch('/api/drivers');
             const drivers = await drRes.json();
             const myDriver = drivers.find((d: any) => d.name === user.name);
             if (myDriver) {
               list = list.filter((t: any) => t.driver_id === myDriver._id);
             }
          } catch (e) {}
        }
        return { data: list };
      } catch (e) {
        return { data: [] };
      }
    },

    create: async (tripData: Omit<Trip, 'id' | 'status' | 'created_at'>) => {
      checkRole(['FLEET_MANAGER', 'DRIVER']);
      try {
        const response = await fetch('/api/trips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tripData)
        });
        if (!response.ok) throw new Error('Failed to create trip');
        let saved = await response.json();
        saved = { ...saved, id: saved._id };
        return { data: saved };
      } catch (err: any) {
        throw { response: { status: 400, data: { message: err.message } } };
      }
    },

    dispatch: async (id: string) => {
      checkRole(['DRIVER']);
      try {
        const response = await fetch(`/api/trips/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'DISPATCHED' })
        });
        if (!response.ok) throw new Error('Failed to dispatch trip');
        let saved = await response.json();
        saved = { ...saved, id: saved._id };
        return { data: saved };
      } catch (err: any) {
        throw { response: { status: 400, data: { message: err.message } } };
      }
    },

    complete: async (id: string, body: { finalOdometer: number; fuelConsumed: number }) => {
      checkRole(['DRIVER']);
      try {
        const response = await fetch(`/api/trips/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            status: 'COMPLETED',
            actual_distance: body.finalOdometer,
            fuel_consumed: body.fuelConsumed
          })
        });
        if (!response.ok) throw new Error('Failed to complete trip');
        let saved = await response.json();
        saved = { ...saved, id: saved._id };
        return { data: saved };
      } catch (err: any) {
        throw { response: { status: 400, data: { message: err.message } } };
      }
    },

    cancel: async (id: string) => {
      checkRole(['DRIVER']);
      try {
        const response = await fetch(`/api/trips/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'CANCELLED' })
        });
        if (!response.ok) throw new Error('Failed to cancel trip');
        let saved = await response.json();
        saved = { ...saved, id: saved._id };
        return { data: saved };
      } catch (err: any) {
        throw { response: { status: 400, data: { message: err.message } } };
      }
    }
  },

  maintenance: {
    list: async (filters?: { vehicleId?: string }) => {
      await delay(300);
      let list = db.getMaintenanceLogs();
      if (filters?.vehicleId) {
        list = list.filter(l => l.vehicle_id === filters.vehicleId);
      }
      return { data: list };
    },

    open: async (body: { vehicleId: string; description: string; cost: number }) => {
      await delay(300);
      checkRole(['FLEET_MANAGER']); // Fleet Manager: "view/manage Maintenance"
      try {
        const saved = db.openMaintenance(body.vehicleId, body.description, body.cost);
        return { data: saved };
      } catch (err: any) {
        throw { response: { status: 400, data: { message: err.message } } };
      }
    },

    close: async (id: string) => {
      await delay(300);
      checkRole(['FLEET_MANAGER']);
      try {
        const closed = db.closeMaintenance(id);
        return { data: closed };
      } catch (err: any) {
        throw { response: { status: 400, data: { message: err.message } } };
      }
    }
  },

  fuelLogs: {
    list: async () => {
      await delay(300);
      return { data: db.getFuelLogs() };
    },
    create: async (body: Omit<FuelLog, 'id' | 'date'>) => {
      await delay(300);
      checkRole(['FINANCIAL_ANALYST']); // Financial Analyst: "full access to Fuel Logs, Expenses"
      const saved = db.saveFuelLog(body);
      return { data: saved };
    }
  },

  expenses: {
    list: async () => {
      await delay(300);
      return { data: db.getExpenses() };
    },
    create: async (body: Omit<Expense, 'id' | 'date'>) => {
      await delay(300);
      checkRole(['FINANCIAL_ANALYST']);
      const saved = db.saveExpense(body);
      return { data: saved };
    }
  },

  dashboard: {
    getKpis: async () => {
      await delay(300);
      const vehicles = db.getVehicles();
      const drivers = db.getDrivers();
      const trips = db.getTrips();

      const activeVehicles = vehicles.filter(v => v.status === 'ON_TRIP').length;
      const availableVehicles = vehicles.filter(v => v.status === 'AVAILABLE').length;
      const inMaintenance = vehicles.filter(v => v.status === 'IN_SHOP').length;
      
      const activeTrips = trips.filter(t => t.status === 'DISPATCHED').length;
      const pendingTrips = trips.filter(t => t.status === 'DRAFT').length;
      
      const driversOnDuty = drivers.filter(d => d.status === 'ON_TRIP').length;
      
      const nonRetiredCount = vehicles.filter(v => v.status !== 'RETIRED').length;
      const fleetUtilizationPct = nonRetiredCount > 0 
        ? Math.round((activeVehicles / nonRetiredCount) * 100)
        : 0;

      return {
        data: {
          activeVehicles,
          availableVehicles,
          inMaintenance,
          activeTrips,
          pendingTrips,
          driversOnDuty,
          fleetUtilizationPct
        }
      };
    }
  },

  reports: {
    fuelEfficiency: async () => {
      await delay(300);
      // Group fuel consumed and distance by vehicle
      const trips = db.getTrips().filter(t => t.status === 'COMPLETED');
      const fuelLogs = db.getFuelLogs();
      const vehicles = db.getVehicles();

      const report = vehicles.map(v => {
        const vehicleTrips = trips.filter(t => t.vehicle_id === v.id);
        const distance = vehicleTrips.reduce((sum, t) => sum + (t.actual_distance || 0), 0);
        
        const vehicleFuel = fuelLogs.filter(f => f.vehicle_id === v.id);
        const fuel = vehicleFuel.reduce((sum, f) => sum + f.liters, 0);

        const lPer100Km = distance > 0 ? Math.round((fuel / distance) * 100 * 10) / 10 : 0;
        
        return {
          vehicleName: v.name,
          registration: v.registration_no,
          distanceKm: distance,
          fuelLiters: fuel,
          fuelEfficiency: lPer100Km // Liters / 100 Km
        };
      });

      return { data: report };
    },

    fleetUtilization: async () => {
      await delay(300);
      // Return simulated daily utilization history for last 7 days
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const report = days.map((day, idx) => {
        // Mock historical data with some randomness centered around current utilization
        const currentKpis = db.getVehicles();
        const nonRetired = currentKpis.filter(v => v.status !== 'RETIRED').length;
        const baseUtil = nonRetired > 0 ? (currentKpis.filter(v => v.status === 'ON_TRIP').length / nonRetired) * 100 : 50;
        const randomFactor = Math.floor(Math.random() * 20) - 10; // -10 to +10
        const rate = Math.max(10, Math.min(100, Math.round(baseUtil + randomFactor + (idx * 2))));
        return {
          day,
          utilizationRate: rate
        };
      });
      return { data: report };
    },

    operationalCost: async () => {
      await delay(300);
      // Aggregate fuel and maintenance expenses
      const expenses = db.getExpenses();
      const fuelLogs = db.getFuelLogs();
      const vehicles = db.getVehicles();

      const fuelTotal = fuelLogs.reduce((sum, f) => sum + f.cost, 0);
      const maintTotal = expenses.filter(e => e.type === 'maintenance').reduce((sum, e) => sum + e.amount, 0);
      const tollTotal = expenses.filter(e => e.type === 'toll').reduce((sum, e) => sum + e.amount, 0);
      const otherTotal = expenses.filter(e => e.type === 'other').reduce((sum, e) => sum + e.amount, 0);

      // Group by vehicle
      const byVehicle = vehicles.map(v => {
        const vFuel = fuelLogs.filter(f => f.vehicle_id === v.id).reduce((sum, f) => sum + f.cost, 0);
        const vMaint = expenses.filter(e => e.vehicle_id === v.id && e.type === 'maintenance').reduce((sum, e) => sum + e.amount, 0);
        const vToll = expenses.filter(e => e.vehicle_id === v.id && e.type === 'toll').reduce((sum, e) => sum + e.amount, 0);
        const vOther = expenses.filter(e => e.vehicle_id === v.id && e.type === 'other').reduce((sum, e) => sum + e.amount, 0);

        return {
          vehicleName: v.name,
          registration: v.registration_no,
          fuelCost: vFuel,
          maintenanceCost: vMaint,
          tollCost: vToll,
          otherCost: vOther,
          totalCost: vFuel + vMaint + vToll + vOther
        };
      });

      return {
        data: {
          breakdown: [
            { name: 'Fuel', value: fuelTotal },
            { name: 'Maintenance', value: maintTotal },
            { name: 'Tolls', value: tollTotal },
            { name: 'Other', value: otherTotal }
          ],
          byVehicle
        }
      };
    },

    vehicleRoi: async () => {
      await delay(300);
      // ROI Formula: (Revenue - (Maintenance + Fuel)) / AcquisitionCost
      // We'll simulate Revenue based on completed distance * rate per km (e.g. $2.50 per km)
      const trips = db.getTrips().filter(t => t.status === 'COMPLETED');
      const fuelLogs = db.getFuelLogs();
      const expenses = db.getExpenses();
      const vehicles = db.getVehicles();

      const report = vehicles.map(v => {
        const vTrips = trips.filter(t => t.vehicle_id === v.id);
        const distance = vTrips.reduce((sum, t) => sum + (t.actual_distance || 0), 0);
        const simulatedRevenue = distance * 2.5; // $2.50 per km

        const vFuel = fuelLogs.filter(f => f.vehicle_id === v.id).reduce((sum, f) => sum + f.cost, 0);
        const vMaint = expenses.filter(e => e.vehicle_id === v.id && e.type === 'maintenance').reduce((sum, e) => sum + e.amount, 0);
        
        const costs = vFuel + vMaint;
        const netProfit = simulatedRevenue - costs;
        const roi = v.acquisition_cost > 0 ? (netProfit / v.acquisition_cost) * 100 : 0;

        return {
          vehicleName: v.name,
          registration: v.registration_no,
          revenue: Math.round(simulatedRevenue),
          costs: Math.round(costs),
          netProfit: Math.round(netProfit),
          acquisitionCost: v.acquisition_cost,
          roi: Math.round(roi * 10) / 10 // ROI %
        };
      });

      return { data: report };
    }
  }
};
