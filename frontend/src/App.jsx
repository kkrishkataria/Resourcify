import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ResourceListPage from './pages/ResourceListPage.jsx';
import ResourceDetailPage from './pages/ResourceDetailPage.jsx';
import AutoAllocatePage from './pages/AutoAllocatePage.jsx';
import MyBookingsPage from './pages/MyBookingsPage.jsx';
import CheckInPage from './pages/CheckInPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import AdminResourcesPage from './pages/AdminResourcesPage.jsx';
import AdminBookingsPage from './pages/AdminBookingsPage.jsx';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Public / Browsable Routes */}
          <Route path="/resources" element={<ResourceListPage />} />
          <Route path="/resources/:id" element={<ResourceDetailPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected User Routes (Requires Sign-In to Book or View Reservations) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/auto-allocate"
            element={
              <ProtectedRoute>
                <AutoAllocatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute>
                <MyBookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkin"
            element={
              <ProtectedRoute>
                <CheckInPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Routes (Requires Sign-In & ADMIN Role) */}
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/resources"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminResourcesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminBookingsPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>© 2026 Resourcify • Thapar Institute of Engineering & Technology (TIET), Patiala.</p>
          <p className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>DynamoDB Atomic Lock Concurrency Active</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
