// src/App.tsx
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { SpaceBackground } from './components/layout/SpaceBackground';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Vehicles } from './pages/Vehicles';
import { Drivers } from './pages/Drivers';
import { Trips } from './pages/Trips';
import { Maintenance } from './pages/Maintenance';
import { FuelExpenses } from './pages/FuelExpenses';
import { Reports } from './pages/Reports';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false
    }
  }
});

const LayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex relative">
      {/* Space stars scrolling background - ONLY FOR FINANCIAL ANALYST */}
      {user?.role === 'FINANCIAL_ANALYST' && <SpaceBackground />}

      {/* Sidebar navigation */}
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      {/* Main Layout Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'pl-20' : 'pl-20 md:pl-64'} z-10`}>
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={
              <ProtectedRoute>
                <LayoutWrapper>
                  <Dashboard />
                </LayoutWrapper>
              </ProtectedRoute>
            } />

            <Route path="/vehicles" element={
              <ProtectedRoute allowedRoles={['FLEET_MANAGER', 'DRIVER', 'FINANCIAL_ANALYST']}>
                <LayoutWrapper>
                  <Vehicles />
                </LayoutWrapper>
              </ProtectedRoute>
            } />

            <Route path="/drivers" element={
              <ProtectedRoute allowedRoles={['FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST']}>
                <LayoutWrapper>
                  <Drivers />
                </LayoutWrapper>
              </ProtectedRoute>
            } />

            <Route path="/trips" element={
              <ProtectedRoute allowedRoles={['FLEET_MANAGER', 'DRIVER', 'FINANCIAL_ANALYST']}>
                <LayoutWrapper>
                  <Trips />
                </LayoutWrapper>
              </ProtectedRoute>
            } />

            <Route path="/maintenance" element={
              <ProtectedRoute allowedRoles={['FLEET_MANAGER', 'DRIVER', 'FINANCIAL_ANALYST']}>
                <LayoutWrapper>
                  <Maintenance />
                </LayoutWrapper>
              </ProtectedRoute>
            } />

            <Route path="/expenses" element={
              <ProtectedRoute allowedRoles={['FLEET_MANAGER', 'DRIVER', 'FINANCIAL_ANALYST']}>
                <LayoutWrapper>
                  <FuelExpenses />
                </LayoutWrapper>
              </ProtectedRoute>
            } />

            <Route path="/reports" element={
              <ProtectedRoute allowedRoles={['FLEET_MANAGER', 'DRIVER', 'FINANCIAL_ANALYST']}>
                <LayoutWrapper>
                  <Reports />
                </LayoutWrapper>
              </ProtectedRoute>
            } />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;