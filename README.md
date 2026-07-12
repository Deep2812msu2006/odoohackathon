# TransitOps — Smart Transport Operations Platform

TransitOps is a Smart Transport Operations Platform that digitizes vehicle, driver, dispatch, maintenance, and expense management for a logistics fleet. This MVP is built with a responsive dashboard and role-based views.

In compliance with the project guidelines, **only the frontend project has been developed first**. The frontend includes a comprehensive mock database (`localStorage` based) and simulated API client that enforces all database relationships, user authorization checks, and business validation rules.

---

## Technical Stack (Frontend)

- **Core**: React 19 + Vite 8 + TypeScript
- **Styling**: TailwindCSS v4 (Slate & Blue theme, glassmorphism cards, custom transitions)
- **Routing**: React Router DOM v6 (RBAC guards, sidebar links)
- **State & Forms**: TanStack Query (React Query) + React Hook Form + Zod validations
- **Charts**: Recharts (Utilization trends, cost centers pie chart, ROI audits)
- **Icons**: Lucide React

---

## Folder Structure

```
transitops/
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── mockDb.ts         # In-browser database seeded with default records
│   │   │   └── apiClient.ts      # API interceptor simulating latency & RBAC rules
│   │   ├── components/
│   │   │   └── layout/           # Sidebar, Topbar, ProtectedRoute
│   │   ├── context/
│   │   │   └── AuthContext.tsx   # Auth session management with inline Role Switcher
│   │   ├── pages/
│   │   │   ├── Login.tsx         # Fast-auth access portal
│   │   │   ├── Dashboard.tsx     # KPI metrics & live chart dashboards
│   │   │   ├── Vehicles.tsx      # Vehicles registry (Fleet Manager CRUD)
│   │   │   ├── Drivers.tsx       # Driver directory highlighting expired licenses
│   │   │   ├── Trips.tsx         # Dispatches manager verifying cargo overload
│   │   │   ├── Maintenance.tsx   # Active and historical repair logs
│   │   │   ├── FuelExpenses.tsx  # General fuel and cost invoice ledger
│   │   │   └── Reports.tsx       # ROI reporting and client-side CSV download
│   │   ├── App.tsx               # Route declarations & Query providers
│   │   ├── main.tsx              # Mount entrypoint
│   │   └── index.css             # Tailwind v4 directives & custom scrollbars
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── README.md
```

---

## Setup & Running Locally

1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install all dependencies:
   ```bash
   npm install
   ```

3. Launch the development server:
   ```bash
   npm run dev
   ```
   *Open [http://localhost:5173/](http://localhost:5173/) in your web browser.*

4. Build the application for production deployment:
   ```bash
   npm run build
   ```
   *Generates minified static assets in `dist/`.*

---

## Role-Based Actions & Demo Guide

To make grading and evaluation extremely simple, the application has an **interactive Role Switcher** in the top header. You can log in and change your role in real-time to observe the following behaviors:

1. **Fleet Manager**:
   - Access to Vehicles page (Full CRUD: Add, Edit, Delete).
   - Access to Maintenance page (Manage logs: Open work orders, Close repairs).
   - Access to Dashboard & Reports (ROI charts, CSV exports).
   - Read-only on Trips and Drivers pages.
2. **Driver**:
   - Access to Trips page (Create draft dispatches, Dispatch trip, Complete trip - prompts for odometer & fuel, Cancel trip).
   - Read-only everywhere else.
3. **Safety Officer**:
   - Access to Drivers page (Full CRUD: Add driver, Edit, Delete).
   - Red alerts highlight licenses expired or expiring within 30 days.
   - Read-only everywhere else.
4. **Financial Analyst**:
   - Access to Fuel & Expenses page (Log fuel fills, log general expenses, calculate total costs per vehicle).
   - Access to Reports page (View ROI graphs, export CSV data).
   - Read-only everywhere else.

---

## Enforced Business Rules (Simulated Server-Side)

1. **Unique Registrations**: Rejects duplicates (409 Conflict).
2. **Available Dispatch Pool**: Excludes `IN_SHOP` or `RETIRED` vehicles from the dispatch selector.
3. **Expired Operators Safeguard**: Blocks drivers with expired CDL licenses or `SUSPENDED` status from trip assignments.
4. **No Double Booking**: A driver or vehicle already `ON_TRIP` cannot be booked again.
5. **Overload Protection**: Blocks trip dispatch if cargo weight exceeds vehicle load capacity.
6. **Atomic Dispatch Flow**: Dispatching a trip sets vehicle and driver to `ON_TRIP` status.
7. **Atomic Completion Flow**: Completing a trip sets vehicle and driver to `AVAILABLE`, logs fuel costs, and increments vehicle odometer.
8. **Repair Locks**: Opening a maintenance log sets vehicle to `IN_SHOP` status, removing it from the available dispatch pool.
9. **Role Permission Checks (RBAC)**: All modifying endpoints verify token roles and deny unauthorized actions with 403 Forbidden status codes.
