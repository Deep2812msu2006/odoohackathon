// src/api/apiClient.ts
import { db } from './mockDb';
import type { User, Vehicle, Driver, Trip, FuelLog, Expense, Role } from './mockDb';

// Utility to delay executions (simulating network latency)
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Retrieve user from sessionStorage to simulate Auth
const getAuthUser = (): User | null => {
  const userStr = sessionStorage.getItem('to_auth_user');
  return userStr ? JSON.parse(userStr) : null;
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
    login: async (email: string, password_hash: string) => {
      await delay(500);
      const users = db.getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      // Simple mock check
      if (!user || password_hash === '') {
        throw { response: { status: 400, data: { message: 'Invalid email or password' } } };
      }
      
      // Store in session storage
      sessionStorage.setItem('to_auth_user', JSON.stringify(user));
      sessionStorage.setItem('to_token', 'mock-jwt-token-' + user.id);
      return { data: { user, token: 'mock-jwt-token-' + user.id } };
    },
    
    register: async (name: string, email: string, role: Role) => {
      await delay(500);
      const users = db.getUsers();
      const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        throw { response: { status: 409, data: { message: 'Email already registered' } } };
      }
      
      const newUser: User = {
        id: 'u-' + Math.random().toString(36).substr(2, 9),
        name,
        email,
        role,
        createdAt: new Date().toISOString()
      };
      
      users.push(newUser);
      localStorage.setItem('to_users', JSON.stringify(users));
      
      return { data: newUser };
    },

    me: async () => {
      await delay(100);
      const user = getAuthUser();
      if (!user) {
        throw { response: { status: 401, data: { message: 'Not authenticated' } } };
      }
      return { data: user };
    },

    logout: async () => {
      await delay(100);
      sessionStorage.removeItem('to_auth_user');
      sessionStorage.removeItem('to_token');
      return { data: { success: true } };
    }
  },

  vehicles: {
    list: async (filters?: { status?: string; type?: string; region?: string }) => {
      await delay(300);
      let list = db.getVehicles();
      if (filters?.status) {
        list = list.filter(v => v.status === filters.status);
      }
      if (filters?.type) {
        list = list.filter(v => v.type.toLowerCase().includes(filters.type!.toLowerCase()));
      }
      if (filters?.region) {
        list = list.filter(v => v.region?.toLowerCase() === filters.region!.toLowerCase());
      }
      return { data: list };
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
      await delay(300);
      checkRole(['FLEET_MANAGER']); // Only Fleet Manager can create
      try {
        const saved = db.saveVehicle(vehicleData);
        return { data: saved };
      } catch (err: any) {
        if (err.message === 'VEHICLE_REGISTRATION_EXISTS') {
          throw { response: { status: 409, data: { message: 'Vehicle registration number already exists.' } } };
        }
        throw { response: { status: 400, data: { message: err.message } } };
      }
    },

    update: async (id: string, vehicleData: Partial<Vehicle>) => {
      await delay(300);
      checkRole(['FLEET_MANAGER']); // Only Fleet Manager can edit
      try {
        const vehicles = db.getVehicles();
        const existing = vehicles.find(v => v.id === id);
        if (!existing) throw { response: { status: 404, data: { message: 'Vehicle not found' } } };
        
        const merged = { ...existing, ...vehicleData } as Vehicle;
        const saved = db.saveVehicle(merged);
        return { data: saved };
      } catch (err: any) {
        if (err.message === 'VEHICLE_REGISTRATION_EXISTS') {
          throw { response: { status: 409, data: { message: 'Vehicle registration number already exists.' } } };
        }
        throw { response: { status: 400, data: { message: err.message } } };
      }
    },

    delete: async (id: string) => {
      await delay(300);
      checkRole(['FLEET_MANAGER']); // Only Fleet Manager can delete
      db.deleteVehicle(id);
      return { data: { success: true } };
    }
  },

  drivers: {
    list: async (filters?: { status?: string }) => {
      await delay(300);
      let list = db.getDrivers();
      if (filters?.status) {
        list = list.filter(d => d.status === filters.status);
      }
      return { data: list };
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
      await delay(300);
      checkRole(['SAFETY_OFFICER']); // Only Safety Officer can CRUD drivers
      try {
        const saved = db.saveDriver(driverData);
        return { data: saved };
      } catch (err: any) {
        if (err.message === 'DRIVER_LICENSE_EXISTS') {
          throw { response: { status: 409, data: { message: 'Driver license number already exists.' } } };
        }
        throw { response: { status: 400, data: { message: err.message } } };
      }
    },

    update: async (id: string, driverData: Partial<Driver>) => {
      await delay(300);
      checkRole(['SAFETY_OFFICER']);
      try {
        const drivers = db.getDrivers();
        const existing = drivers.find(d => d.id === id);
        if (!existing) throw { response: { status: 404, data: { message: 'Driver not found' } } };

        const merged = { ...existing, ...driverData } as Driver;
        const saved = db.saveDriver(merged);
        return { data: saved };
      } catch (err: any) {
        if (err.message === 'DRIVER_LICENSE_EXISTS') {
          throw { response: { status: 409, data: { message: 'Driver license number already exists.' } } };
        }
        throw { response: { status: 400, data: { message: err.message } } };
      }
    },

    delete: async (id: string) => {
      await delay(300);
      checkRole(['SAFETY_OFFICER']);
      db.deleteDriver(id);
      return { data: { success: true } };
    }
  },

  trips: {
    list: async (filters?: { status?: string }) => {
      await delay(300);
      let list = db.getTrips();
      if (filters?.status) {
        list = list.filter(t => t.status === filters.status);
      }
      
      // Role enforcement check: Drivers can only view their own trips (or all if we want to filter, but user requested: "view own trips")
      const user = getAuthUser();
      if (user && user.role === 'DRIVER') {
        const driver = db.getDrivers().find(d => d.name === user.name); // match driver by name or mock relationship
        if (driver) {
          list = list.filter(t => t.driver_id === driver.id);
        }
      }
      
      return { data: list };
    },

    create: async (tripData: Omit<Trip, 'id' | 'status' | 'created_at'>) => {
      await delay(300);
      // Fleet Managers and Drivers can create trips (Drivers can create trips, and managers can view them/etc)
      checkRole(['FLEET_MANAGER', 'DRIVER']);
      try {
        const saved = db.createTrip(tripData);
        return { data: saved };
      } catch (err: any) {
        throw { response: { status: 400, data: { message: err.message } } };
      }
    },

    dispatch: async (id: string) => {
      await delay(300);
      checkRole(['DRIVER']); // Rule permissions: "Driver: create/dispatch/complete/cancel Trips"
      try {
        const updated = db.dispatchTrip(id);
        return { data: updated };
      } catch (err: any) {
        throw { response: { status: 400, data: { message: err.message } } };
      }
    },

    complete: async (id: string, body: { finalOdometer: number; fuelConsumed: number }) => {
      await delay(300);
      checkRole(['DRIVER']);
      try {
        const updated = db.completeTrip(id, body.finalOdometer, body.fuelConsumed);
        return { data: updated };
      } catch (err: any) {
        throw { response: { status: 400, data: { message: err.message } } };
      }
    },

    cancel: async (id: string) => {
      await delay(300);
      checkRole(['DRIVER']);
      try {
        const updated = db.cancelTrip(id);
        return { data: updated };
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
