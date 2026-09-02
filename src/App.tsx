import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import { GlobalErrorBoundary } from './components/ErrorBoundary';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import MobileLayout from './layouts/MobileLayout';

// Pages (Lazy Loaded)
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const Users = React.lazy(() => import('./pages/admin/Users'));
const Locations = React.lazy(() => import('./pages/admin/Locations'));
const Documents = React.lazy(() => import('./pages/admin/Documents'));
const MobileHome = React.lazy(() => import('./pages/mobile/MobileHome'));
const Scanner = React.lazy(() => import('./pages/mobile/Scanner'));

// Loading component
const PageLoader = () => (
  <div className="flex h-screen items-center justify-center bg-slate-50">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800000]"></div>
  </div>
);

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
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
    <GlobalErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />

              {/* Web Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="users" element={<Users />} />
                <Route path="locations" element={<Locations />} />
                <Route path="documents" element={<Documents />} />
              </Route>

              {/* Mobile Routes (for couriers/receivers etc) */}
              <Route
                path="/m"
                element={
                  <ProtectedRoute>
                    <MobileLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<MobileHome />} />
                <Route path="scan" element={<Scanner />} />
              </Route>

              {/* Redirect root based on role */}
              <Route path="/" element={<RoleBasedRedirect />} />
            </Routes>
          </Suspense>
          <Toaster position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </GlobalErrorBoundary>
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
