import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import MobileLayout from './layouts/MobileLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
import Locations from './pages/admin/Locations';
import Documents from './pages/admin/Documents';
import MobileHome from './pages/mobile/MobileHome';
import Scanner from './pages/mobile/Scanner';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />; // Or unauthorized
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Web Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="locations" element={<Locations />} />
            <Route path="documents" element={<Documents />} />
          </Route>

          {/* Mobile Routes (for couriers/receivers etc) */}
          <Route path="/m" element={
            <ProtectedRoute>
              <MobileLayout />
            </ProtectedRoute>
          }>
            <Route index element={<MobileHome />} />
            <Route path="scan" element={<Scanner />} />
          </Route>

          {/* Redirect root based on role */}
          <Route path="/" element={<RoleBasedRedirect />} />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

function RoleBasedRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  if (['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
    return <Navigate to="/admin" />;
  }
  return <Navigate to="/m" />;
}
