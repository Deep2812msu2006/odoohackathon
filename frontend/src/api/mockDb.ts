// src/api/mockDb.ts

export type Role = 'FLEET_MANAGER' | 'DRIVER' | 'SAFETY_OFFICER' | 'FINANCIAL_ANALYST';
export type VehicleStatus = 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED';
export type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED';
export type TripStatus = 'DRAFT' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  registration_no: string;
  name: string;
  type: string;
  max_load_capacity: number;
  odometer: number;
  acquisition_cost: number;
  status: VehicleStatus;
  region: string;
  created_at: string;
}

export interface Driver {
  id: string;
  name: string;
  license_number: string;
  license_category: string;
  license_expiry_date: string; // YYYY-MM-DD
  contact_number: string;
  safety_score: number;
  status: DriverStatus;
  created_at: string;
  notes?: string;
}

export interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicle_id: string;
  driver_id: string;
  cargo_weight: number;
  planned_distance: number;
  actual_distance?: number;
  fuel_consumed?: number;
  status: TripStatus;
  dispatched_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface MaintenanceLog {
  id: string;
  vehicle_id: string;
  description: string;
  cost: number;
  is_active: boolean;
  started_at: string;
  closed_at?: string;
}

export interface FuelLog {
  id: string;
  vehicle_id: string;
  liters: number;
  cost: number;
  date: string;
}

export interface Expense {
  id: string;
  vehicle_id: string;
  type: string; // toll, maintenance, other
  amount: number;
  date: string;
  notes?: string;
}

// Generate UUID simple helper
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Seed Data
const initialUsers: User[] = [
  { id: '1', name: 'Frank Manager', email: 'manager@transitops.com', role: 'FLEET_MANAGER', createdAt: new Date().toISOString() },
  { id: '2', name: 'Dave Driver', email: 'driver@transitops.com', role: 'DRIVER', createdAt: new Date().toISOString() },
  { id: '3', name: 'Sarah Safety', email: 'safety@transitops.com', role: 'SAFETY_OFFICER', createdAt: new Date().toISOString() },
  { id: '4', name: 'Fiona Finance', email: 'finance@transitops.com', role: 'FINANCIAL_ANALYST', createdAt: new Date().toISOString() }
];

const initialVehicles: Vehicle[] = [
  { id: 'v1', registration_no: 'TX-8829-A', name: 'Scania R450 Heavy', type: 'Semi-Truck', max_load_capacity: 25000, odometer: 125400, acquisition_cost: 110000, status: 'AVAILABLE', region: 'North', created_at: new Date().toISOString() },
  { id: 'v2', registration_no: 'TX-4402-B', name: 'Volvo FH16 Cargo', type: 'Flatbed', max_load_capacity: 20000, odometer: 85200, acquisition_cost: 95000, status: 'ON_TRIP', region: 'South', created_at: new Date().toISOString() },
  { id: 'v3', registration_no: 'TX-1188-C', name: 'Mercedes Sprinter Express', type: 'Van', max_load_capacity: 3500, odometer: 42100, acquisition_cost: 45000, status: 'IN_SHOP', region: 'West', created_at: new Date().toISOString() },
  { id: 'v4', registration_no: 'TX-9010-D', name: 'Isuzu NPR Box', type: 'Box Truck', max_load_capacity: 7500, odometer: 63800, acquisition_cost: 55000, status: 'AVAILABLE', region: 'East', created_at: new Date().toISOString() },
  { id: 'v5', registration_no: 'TX-7766-E', name: 'Peterbilt 389 Classic', type: 'Semi-Truck', max_load_capacity: 28000, odometer: 320000, acquisition_cost: 130000, status: 'RETIRED', region: 'North', created_at: new Date().toISOString() }
];

const initialDrivers: Driver[] = [
  { id: 'd1', name: 'Dave Driver', license_number: 'DL-992819-01', license_category: 'Class A CDL', license_expiry_date: '2028-12-15', contact_number: '+1 (555) 019-2831', safety_score: 95, status: 'ON_TRIP', created_at: new Date().toISOString() },
  { id: 'd2', name: 'Bob Baker', license_number: 'DL-881920-02', license_category: 'Class A CDL', license_expiry_date: '2027-05-10', contact_number: '+1 (555) 018-4729', safety_score: 98, status: 'AVAILABLE', created_at: new Date().toISOString() },
  { id: 'd3', name: 'Charlie Cox', license_number: 'DL-772918-03', license_category: 'Class B CDL', license_expiry_date: '2026-07-01', contact_number: '+1 (555) 017-9812', safety_score: 84, status: 'AVAILABLE', created_at: new Date().toISOString() },
  { id: 'd4', name: 'Steve Stone', license_number: 'DL-552918-04', license_category: 'Class A CDL', license_expiry_date: '2029-01-20', contact_number: '+1 (555) 015-3819', safety_score: 55, status: 'SUSPENDED', created_at: new Date().toISOString() },
  { id: 'd5', name: 'Alice Adams', license_number: 'DL-661298-05', license_category: 'Class A CDL', license_expiry_date: '2026-08-05', contact_number: '+1 (555) 016-4822', safety_score: 90, status: 'AVAILABLE', created_at: new Date().toISOString() } // Expiry in < 30 days
];

const initialTrips: Trip[] = [
  { id: 't1', source: 'Chicago Depot', destination: 'Detroit Terminal', vehicle_id: 'v2', driver_id: 'd1', cargo_weight: 15000, planned_distance: 280, status: 'DISPATCHED', dispatched_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: 't2', source: 'Houston Hub', destination: 'Dallas Center', vehicle_id: 'v1', driver_id: 'd2', cargo_weight: 12000, planned_distance: 240, status: 'DRAFT', created_at: new Date().toISOString() },
  { id: 't3', source: 'New York Port', destination: 'Boston Warehouse', vehicle_id: 'v4', driver_id: 'd2', cargo_weight: 6000, planned_distance: 215, actual_distance: 220, fuel_consumed: 95, status: 'COMPLETED', dispatched_at: new Date(Date.now() - 86400000).toISOString(), completed_at: new Date().toISOString(), created_at: new Date(Date.now() - 86400000).toISOString() }
];

const initialMaintenance: MaintenanceLog[] = [
  { id: 'm1', vehicle_id: 'v3', description: 'Engine oil replacement and filter change', cost: 450, is_active: true, started_at: new Date().toISOString() },
  { id: 'm2', vehicle_id: 'v1', description: 'Brake pad renewal and rotor resurfacing', cost: 1200, is_active: false, started_at: new Date(Date.now() - 5 * 86400000).toISOString(), closed_at: new Date(Date.now() - 4 * 86400000).toISOString() }
];

const initialFuelLogs: FuelLog[] = [
  { id: 'f1', vehicle_id: 'v1', liters: 120, cost: 216, date: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'f2', vehicle_id: 'v2', liters: 180, cost: 324, date: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'f3', vehicle_id: 'v4', liters: 80, cost: 144, date: new Date(Date.now() - 86400000).toISOString() }
];

const initialExpenses: Expense[] = [
  { id: 'e1', vehicle_id: 'v1', type: 'toll', amount: 45, date: new Date(Date.now() - 3 * 86400000).toISOString(), notes: 'I-90 highway tolls' },
  { id: 'e2', vehicle_id: 'v1', type: 'maintenance', amount: 1200, date: new Date(Date.now() - 4 * 86400000).toISOString(), notes: 'Brake repairs (linked to closed log)' },
  { id: 'e3', vehicle_id: 'v3', type: 'other', amount: 80, date: new Date().toISOString(), notes: 'Emergency warning triangle kit replacement' }
];

// Helper to initialize local storage
const initializeDB = () => {
  if (!localStorage.getItem('to_users')) localStorage.setItem('to_users', JSON.stringify(initialUsers));
  if (!localStorage.getItem('to_vehicles')) localStorage.setItem('to_vehicles', JSON.stringify(initialVehicles));
  if (!localStorage.getItem('to_drivers')) localStorage.setItem('to_drivers', JSON.stringify(initialDrivers));
  if (!localStorage.getItem('to_trips')) localStorage.setItem('to_trips', JSON.stringify(initialTrips));
  if (!localStorage.getItem('to_maintenance')) localStorage.setItem('to_maintenance', JSON.stringify(initialMaintenance));
  if (!localStorage.getItem('to_fuel_logs')) localStorage.setItem('to_fuel_logs', JSON.stringify(initialFuelLogs));
  if (!localStorage.getItem('to_expenses')) localStorage.setItem('to_expenses', JSON.stringify(initialExpenses));
};

initializeDB();

// Clean existing localStorage driver name markers if present from previous sessions
try {
  const storedDrivers = localStorage.getItem('to_drivers');
  if (storedDrivers) {
    const parsed = JSON.parse(storedDrivers);
    let updated = false;
    const cleaned = parsed.map((d: any) => {
      if (d.name.includes(' (Expired)')) {
        d.name = d.name.replace(' (Expired)', '');
        updated = true;
      }
      if (d.name.includes(' (Suspended)')) {
        d.name = d.name.replace(' (Suspended)', '');
        updated = true;
      }
      return d;
    });
    if (updated) {
      localStorage.setItem('to_drivers', JSON.stringify(cleaned));
    }
  }
} catch (e) {
  console.error('Error cleaning up local storage driver names', e);
}

// DB Access Methods simulating atomic queries and business rules
export const db = {
  // --- USERS / AUTH ---
  getUsers: (): User[] => JSON.parse(localStorage.getItem('to_users') || '[]'),
  
  // --- VEHICLES ---
  getVehicles: (): Vehicle[] => JSON.parse(localStorage.getItem('to_vehicles') || '[]'),
  saveVehicle: (vehicle: Omit<Vehicle, 'id' | 'created_at'> & { id?: string }): Vehicle => {
    const vehicles = db.getVehicles();
    
    // Rule 1: Registration number unique check (except if editing same vehicle)
    const exists = vehicles.find(v => v.registration_no.toLowerCase() === vehicle.registration_no.toLowerCase() && v.id !== vehicle.id);
    if (exists) {
      throw new Error('VEHICLE_REGISTRATION_EXISTS');
    }

    if (vehicle.id) {
      const idx = vehicles.findIndex(v => v.id === vehicle.id);
      if (idx !== -1) {
        vehicles[idx] = { ...vehicles[idx], ...vehicle } as Vehicle;
      }
      localStorage.setItem('to_vehicles', JSON.stringify(vehicles));
      return vehicles[idx];
    } else {
      const newVehicle: Vehicle = {
        ...vehicle,
        id: 'v-' + generateUUID().substring(0, 8),
        created_at: new Date().toISOString()
      };
      vehicles.push(newVehicle);
      localStorage.setItem('to_vehicles', JSON.stringify(vehicles));
      return newVehicle;
    }
  },
  deleteVehicle: (id: string) => {
    const vehicles = db.getVehicles().filter(v => v.id !== id);
    localStorage.setItem('to_vehicles', JSON.stringify(vehicles));
  },
  getAvailableVehicles: (): Vehicle[] => {
    // Rule 2: Vehicles with status RETIRED or IN_SHOP must never appear in the trip-creation vehicle dropdown
    // Also exclude vehicles that are currently ON_TRIP since a vehicle ON_TRIP cannot be assigned to another trip (Rule 4)
    return db.getVehicles().filter(v => v.status === 'AVAILABLE');
  },

  // --- DRIVERS ---
  getDrivers: (): Driver[] => JSON.parse(localStorage.getItem('to_drivers') || '[]'),
  saveDriver: (driver: Omit<Driver, 'id' | 'created_at'> & { id?: string }): Driver => {
    const drivers = db.getDrivers();
    
    // License unique check
    const exists = drivers.find(d => d.license_number.toLowerCase() === driver.license_number.toLowerCase() && d.id !== driver.id);
    if (exists) {
      throw new Error('DRIVER_LICENSE_EXISTS');
    }

    if (driver.id) {
      const idx = drivers.findIndex(d => d.id === driver.id);
      if (idx !== -1) {
        drivers[idx] = { ...drivers[idx], ...driver } as Driver;
      }
      localStorage.setItem('to_drivers', JSON.stringify(drivers));
      return drivers[idx];
    } else {
      const newDriver: Driver = {
        ...driver,
        id: 'd-' + generateUUID().substring(0, 8),
        created_at: new Date().toISOString()
      };
      drivers.push(newDriver);
      localStorage.setItem('to_drivers', JSON.stringify(drivers));
      return newDriver;
    }
  },
  deleteDriver: (id: string) => {
    const drivers = db.getDrivers().filter(d => d.id !== id);
    localStorage.setItem('to_drivers', JSON.stringify(drivers));
  },
  getAvailableDrivers: (): Driver[] => {
    // Rule 3: Drivers with expired license or status SUSPENDED cannot be assigned to a trip.
    // Rule 4: Drivers already ON_TRIP cannot be assigned.
    const today = new Date().toISOString().split('T')[0];
    return db.getDrivers().filter(d => {
      const isExpired = d.license_expiry_date < today;
      const isSuspended = d.status === 'SUSPENDED';
      const isOnTrip = d.status === 'ON_TRIP';
      const isOffDuty = d.status === 'OFF_DUTY';
      return !isExpired && !isSuspended && !isOnTrip && !isOffDuty;
    });
  },

  // --- TRIPS ---
  getTrips: (): Trip[] => JSON.parse(localStorage.getItem('to_trips') || '[]'),
  createTrip: (tripData: Omit<Trip, 'id' | 'status' | 'created_at'>): Trip => {
    const vehicles = db.getVehicles();
    const drivers = db.getDrivers();
    
    const vehicle = vehicles.find(v => v.id === tripData.vehicle_id);
    const driver = drivers.find(d => d.id === tripData.driver_id);

    if (!vehicle) throw new Error('VEHICLE_NOT_FOUND');
    if (!driver) throw new Error('DRIVER_NOT_FOUND');

    // Rule 2: Exclude RETIRED / IN_SHOP
    if (vehicle.status === 'RETIRED' || vehicle.status === 'IN_SHOP') {
      throw new Error('VEHICLE_UNAVAILABLE');
    }

    // Rule 3: Drivers with expired license or status SUSPENDED cannot be assigned.
    const today = new Date().toISOString().split('T')[0];
    if (driver.license_expiry_date < today) {
      throw new Error('DRIVER_LICENSE_EXPIRED');
    }
    if (driver.status === 'SUSPENDED') {
      throw new Error('DRIVER_SUSPENDED');
    }

    // Rule 4: A vehicle or driver already ON_TRIP cannot be assigned.
    if (vehicle.status === 'ON_TRIP') {
      throw new Error('VEHICLE_ALREADY_ON_TRIP');
    }
    if (driver.status === 'ON_TRIP') {
      throw new Error('DRIVER_ALREADY_ON_TRIP');
    }

    // Rule 5: cargoWeight must not exceed maxLoadCapacity
    if (tripData.cargo_weight > vehicle.max_load_capacity) {
      throw new Error('CARGO_EXCEEDS_CAPACITY');
    }

    const trips = db.getTrips();
    const newTrip: Trip = {
      ...tripData,
      id: 't-' + generateUUID().substring(0, 8),
      status: 'DRAFT',
      created_at: new Date().toISOString()
    };
    trips.push(newTrip);
    localStorage.setItem('to_trips', JSON.stringify(trips));
    return newTrip;
  },

  // Rule 6: Dispatching a trip (DRAFT -> DISPATCHED) atomically sets vehicle.status = ON_TRIP and driver.status = ON_TRIP.
  dispatchTrip: (id: string): Trip => {
    const trips = db.getTrips();
    const idx = trips.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('TRIP_NOT_FOUND');
    
    const trip = trips[idx];
    if (trip.status !== 'DRAFT') throw new Error('TRIP_NOT_IN_DRAFT');

    const vehicles = db.getVehicles();
    const drivers = db.getDrivers();

    const vehicleIdx = vehicles.findIndex(v => v.id === trip.vehicle_id);
    const driverIdx = drivers.findIndex(d => d.id === trip.driver_id);

    if (vehicleIdx === -1) throw new Error('VEHICLE_NOT_FOUND');
    if (driverIdx === -1) throw new Error('DRIVER_NOT_FOUND');

    // Re-verify availability at dispatch time
    if (vehicles[vehicleIdx].status === 'ON_TRIP') throw new Error('VEHICLE_ALREADY_ON_TRIP');
    if (drivers[driverIdx].status === 'ON_TRIP') throw new Error('DRIVER_ALREADY_ON_TRIP');
    if (vehicles[vehicleIdx].status === 'IN_SHOP') throw new Error('VEHICLE_IN_SHOP');
    if (drivers[driverIdx].status === 'SUSPENDED') throw new Error('DRIVER_SUSPENDED');

    // Atomic update
    trips[idx].status = 'DISPATCHED';
    trips[idx].dispatched_at = new Date().toISOString();
    
    vehicles[vehicleIdx].status = 'ON_TRIP';
    drivers[driverIdx].status = 'ON_TRIP';

    localStorage.setItem('to_trips', JSON.stringify(trips));
    localStorage.setItem('to_vehicles', JSON.stringify(vehicles));
    localStorage.setItem('to_drivers', JSON.stringify(drivers));

    return trips[idx];
  },

  // Rule 7: Completing a trip (DISPATCHED -> COMPLETED) atomically sets vehicle.status = AVAILABLE and driver.status = AVAILABLE.
  completeTrip: (id: string, actualDistance: number, fuelConsumed: number): Trip => {
    const trips = db.getTrips();
    const idx = trips.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('TRIP_NOT_FOUND');

    const trip = trips[idx];
    if (trip.status !== 'DISPATCHED') throw new Error('TRIP_NOT_DISPATCHED');

    const vehicles = db.getVehicles();
    const drivers = db.getDrivers();

    const vehicleIdx = vehicles.findIndex(v => v.id === trip.vehicle_id);
    const driverIdx = drivers.findIndex(d => d.id === trip.driver_id);

    if (vehicleIdx === -1) throw new Error('VEHICLE_NOT_FOUND');
    if (driverIdx === -1) throw new Error('DRIVER_NOT_FOUND');

    const vehicle = vehicles[vehicleIdx];
    
    // Atomic updates
    trips[idx].status = 'COMPLETED';
    trips[idx].actual_distance = actualDistance;
    trips[idx].fuel_consumed = fuelConsumed;
    trips[idx].completed_at = new Date().toISOString();

    vehicles[vehicleIdx].status = 'AVAILABLE';
    vehicles[vehicleIdx].odometer = vehicle.odometer + actualDistance;
    
    drivers[driverIdx].status = 'AVAILABLE';

    // Log fuel automatically
    const fuelLogs = db.getFuelLogs();
    const fuelCost = fuelConsumed * 1.8; // Simulated cost per liter ($1.80)
    fuelLogs.push({
      id: 'f-' + generateUUID().substring(0, 8),
      vehicle_id: trip.vehicle_id,
      liters: fuelConsumed,
      cost: fuelCost,
      date: new Date().toISOString()
    });

    localStorage.setItem('to_trips', JSON.stringify(trips));
    localStorage.setItem('to_vehicles', JSON.stringify(vehicles));
    localStorage.setItem('to_drivers', JSON.stringify(drivers));
    localStorage.setItem('to_fuel_logs', JSON.stringify(fuelLogs));

    return trips[idx];
  },

  // Rule 8: Cancelling a dispatched trip restores vehicle and driver to AVAILABLE.
  cancelTrip: (id: string): Trip => {
    const trips = db.getTrips();
    const idx = trips.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('TRIP_NOT_FOUND');

    const trip = trips[idx];
    if (trip.status !== 'DISPATCHED' && trip.status !== 'DRAFT') {
      throw new Error('CANNOT_CANCEL_TRIP');
    }

    const vehicles = db.getVehicles();
    const drivers = db.getDrivers();

    const vehicleIdx = vehicles.findIndex(v => v.id === trip.vehicle_id);
    const driverIdx = drivers.findIndex(d => d.id === trip.driver_id);

    trips[idx].status = 'CANCELLED';

    // Only restore if it was actually dispatched (if draft, they were already AVAILABLE)
    if (trip.status === 'DISPATCHED') {
      if (vehicleIdx !== -1) vehicles[vehicleIdx].status = 'AVAILABLE';
      if (driverIdx !== -1) drivers[driverIdx].status = 'AVAILABLE';
    }

    localStorage.setItem('to_trips', JSON.stringify(trips));
    localStorage.setItem('to_vehicles', JSON.stringify(vehicles));
    localStorage.setItem('to_drivers', JSON.stringify(drivers));

    return trips[idx];
  },

  // --- MAINTENANCE LOGS ---
  getMaintenanceLogs: (): MaintenanceLog[] => JSON.parse(localStorage.getItem('to_maintenance') || '[]'),
  
  // Rule 9: Creating an active maintenance log sets vehicle.status = IN_SHOP immediately.
  openMaintenance: (vehicleId: string, description: string, cost: number): MaintenanceLog => {
    const vehicles = db.getVehicles();
    const vehicleIdx = vehicles.findIndex(v => v.id === vehicleId);
    if (vehicleIdx === -1) throw new Error('VEHICLE_NOT_FOUND');

    const vehicle = vehicles[vehicleIdx];
    if (vehicle.status === 'ON_TRIP') throw new Error('VEHICLE_ON_TRIP_CANNOT_MAINTAIN');

    const logs = db.getMaintenanceLogs();
    const newLog: MaintenanceLog = {
      id: 'm-' + generateUUID().substring(0, 8),
      vehicle_id: vehicleId,
      description,
      cost,
      is_active: true,
      started_at: new Date().toISOString()
    };
    logs.push(newLog);

    vehicles[vehicleIdx].status = 'IN_SHOP';

    // Log as a vehicle expense automatically
    const expenses = db.getExpenses();
    expenses.push({
      id: 'e-' + generateUUID().substring(0, 8),
      vehicle_id: vehicleId,
      type: 'maintenance',
      amount: cost,
      date: new Date().toISOString(),
      notes: `Maintenance log start: ${description}`
    });

    localStorage.setItem('to_maintenance', JSON.stringify(logs));
    localStorage.setItem('to_vehicles', JSON.stringify(vehicles));
    localStorage.setItem('to_expenses', JSON.stringify(expenses));

    return newLog;
  },

  // Rule 10: Closing a maintenance log restores vehicle.status = AVAILABLE, unless the vehicle is RETIRED.
  closeMaintenance: (id: string): MaintenanceLog => {
    const logs = db.getMaintenanceLogs();
    const idx = logs.findIndex(l => l.id === id);
    if (idx === -1) throw new Error('LOG_NOT_FOUND');

    const log = logs[idx];
    if (!log.is_active) throw new Error('LOG_ALREADY_CLOSED');

    const vehicles = db.getVehicles();
    const vehicleIdx = vehicles.findIndex(v => v.id === log.vehicle_id);

    logs[idx].is_active = false;
    logs[idx].closed_at = new Date().toISOString();

    if (vehicleIdx !== -1) {
      const vehicle = vehicles[vehicleIdx];
      if (vehicle.status !== 'RETIRED') {
        vehicles[vehicleIdx].status = 'AVAILABLE';
      }
    }

    localStorage.setItem('to_maintenance', JSON.stringify(logs));
    localStorage.setItem('to_vehicles', JSON.stringify(vehicles));

    return logs[idx];
  },

  // --- FUEL LOGS ---
  getFuelLogs: (): FuelLog[] => JSON.parse(localStorage.getItem('to_fuel_logs') || '[]'),
  saveFuelLog: (log: Omit<FuelLog, 'id' | 'date'>): FuelLog => {
    const logs = db.getFuelLogs();
    const newLog: FuelLog = {
      ...log,
      id: 'f-' + generateUUID().substring(0, 8),
      date: new Date().toISOString()
    };
    logs.push(newLog);
    localStorage.setItem('to_fuel_logs', JSON.stringify(logs));

    // Also auto-add to general expenses for convenience/consistency
    const expenses = db.getExpenses();
    expenses.push({
      id: 'e-' + generateUUID().substring(0, 8),
      vehicle_id: log.vehicle_id,
      type: 'fuel',
      amount: log.cost,
      date: new Date().toISOString(),
      notes: `Fueled ${log.liters}L`
    });
    localStorage.setItem('to_expenses', JSON.stringify(expenses));

    return newLog;
  },

  // --- EXPENSES ---
  getExpenses: (): Expense[] => JSON.parse(localStorage.getItem('to_expenses') || '[]'),
  saveExpense: (expense: Omit<Expense, 'id' | 'date'>): Expense => {
    const expenses = db.getExpenses();
    const newExpense: Expense = {
      ...expense,
      id: 'e-' + generateUUID().substring(0, 8),
      date: new Date().toISOString()
    };
    expenses.push(newExpense);
    localStorage.setItem('to_expenses', JSON.stringify(expenses));
    return newExpense;
  }
};
