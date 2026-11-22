import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { formatDate } from '../utils/formatters.js';
import {
  Calendar,
  Clock,
  Sparkles,
  Search,
  CheckCircle2,
  XCircle,
  Building,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState('');

  const fetchUserBookings = async () => {
    try {
      const res = await api.get('/bookings');
      if (res.data?.success) {
        setBookings(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserBookings();
  }, [user]);

  const handleCheckIn = async (bookingId) => {
    setActionLoading(bookingId);
    setMessage('');
    try {
      const res = await api.post(`/bookings/${bookingId}/checkin`);
      if (res.data?.success) {
        setMessage('Check-in successful! Your reservation is confirmed active.');
        fetchUserBookings();
      }
    } catch (err) {
      setMessage(`Check-in failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this reservation? Its time slots will immediately be released.')) {
      return;
    }
    setActionLoading(bookingId);
    try {
      const res = await api.delete(`/bookings/${bookingId}`);
      if (res.data?.success) {
        setMessage('Reservation cancelled and slots successfully released.');
        fetchUserBookings();
      }
    } catch (err) {
      setMessage(`Cancellation failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const activeReservations = bookings.filter(
    (b) => b.status === 'CONFIRMED' || b.status === 'CHECKED_IN'
  );
  const upcomingReservations = bookings.filter((b) => b.status === 'CONFIRMED');

  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-blue-50 text-campus-800 border border-blue-100">
              {user?.role} PORTAL
            </span>
            <span className="text-xs text-slate-400">• {user?.department}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2 tracking-tight">
            Welcome back, {user?.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Reserve campus facilities, check in to current slots, and prevent double bookings with atomic cloud allocation.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/auto-allocate"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-campus-800 hover:bg-campus-900 text-white font-medium text-sm shadow-xs transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Smart Auto-Allocate</span>
          </Link>
          <Link
            to="/resources"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-sm transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>Browse All Venues</span>
          </Link>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-sm flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-blue-500 hover:text-blue-700 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Reservations"
          value={activeReservations.length}
          subtitle="Currently held slot locks"
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="Pending Check-in"
          value={upcomingReservations.length}
          subtitle="Requires check-in within grace period"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Total Bookings"
          value={bookings.length}
          subtitle="Lifetime reservation count"
          icon={Building}
          color="emerald"
        />
        <StatCard
          title="Campus Role Status"
          value={user?.role}
          subtitle="Access verified via Cognito/IAM"
          icon={CheckCircle2}
          color="purple"
        />
      </div>

      {/* Upcoming / Active Reservations */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your Current & Upcoming Reservations</h2>
            <p className="text-xs text-slate-500">Atomic DynamoDB lock holds 30-min increments</p>
          </div>
          <Link to="/my-bookings" className="text-xs font-semibold text-campus-700 hover:text-campus-900 flex items-center space-x-1">
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {activeReservations.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No active reservations"
              description="You do not have any active or upcoming facility bookings."
              actionText="Book a Resource Now"
              onAction={() => navigate('/resources')}
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activeReservations.map((booking) => (
              <div key={booking.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={booking.status} />
                    <span className="text-xs text-slate-400">ID: {booking.id.slice(0, 12)}...</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{booking.resourceName}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDate(booking.date)}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-800">{booking.startTime} - {booking.endTime}</span>
                    </span>
                    <span>• {booking.purpose}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5">
                  {booking.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleCheckIn(booking.id)}
                      disabled={actionLoading === booking.id}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{actionLoading === booking.id ? 'Checking In...' : 'Check In'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleCancel(booking.id)}
                    disabled={actionLoading === booking.id}
                    className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-slate-700 text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
