import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
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
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/resources" element={<ResourceListPage />} />
          <Route path="/resources/:id" element={<ResourceDetailPage />} />
          <Route path="/auto-allocate" element={<AutoAllocatePage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
          <Route path="/checkin" element={<CheckInPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Admin Routes */}
          <Route path="/admin/analytics" element={<AdminDashboardPage />} />
          <Route path="/admin/resources" element={<AdminResourcesPage />} />
          <Route path="/admin/bookings" element={<AdminBookingsPage />} />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>© 2026 CampusSlot – ResourSync Intelligent Cloud Allocation System.</p>
          <p className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>DynamoDB Atomic Concurrency Engine Active</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
