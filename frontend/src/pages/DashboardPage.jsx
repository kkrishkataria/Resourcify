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
  Building,
  ArrowRight,
  GraduationCap,
  LogOut,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
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
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchUserBookings();
  }, [user, isAuthenticated]);

  const handleCheckIn = async (bookingId) => {
    setActionLoading(bookingId);
    setMessage('');
    try {
      const res = await api.post(`/bookings/${bookingId}/checkin`);
      if (res.data?.success) {
        setMessage('Check-in successful! Your attendance at the Thapar facility has been recorded.');
        fetchUserBookings();
      }
    } catch (err) {
      setMessage(`Check-in failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckOut = async (bookingId) => {
    if (!window.confirm('Check out of this venue now? Any remaining slots will be released immediately.')) {
      return;
    }
    setActionLoading(bookingId);
    setMessage('');
    try {
      const res = await api.post(`/bookings/${bookingId}/checkout`);
      if (res.data?.success) {
        setMessage('Checked out successfully! The facility has been freed for other students.');
        fetchUserBookings();
      }
    } catch (err) {
      setMessage(`Check-out failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this reservation? Its 30-min slot locks will immediately be freed for other Thapar students.')) {
      return;
    }
    setActionLoading(bookingId);
    try {
      const res = await api.delete(`/bookings/${bookingId}`);
      if (res.data?.success) {
        setMessage('Reservation cancelled and facility slots successfully released.');
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
    return <LoadingSpinner message="Accessing your Thapar Resourcify dashboard..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-thapar-100 text-thapar-800 border border-thapar-200">
              TIET {user?.role} PORTAL
            </span>
            <span className="text-xs text-slate-500">• {user?.department}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
            Welcome, {user?.name || 'Thapar Member'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Reserve Nava Nalanda Central Library pods, COS Labs, LP Lecture Halls, and Sports Courts with atomic conflict prevention.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/auto-allocate"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-thapar-800 hover:bg-thapar-900 text-white font-medium text-sm shadow-xs transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Smart Auto-Allocate</span>
          </Link>
          <Link
            to="/resources"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-sm transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>Browse Thapar Venues</span>
          </Link>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-thapar-50 border border-thapar-200 text-thapar-900 text-sm flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-thapar-800 hover:text-thapar-950 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Reservations"
          value={activeReservations.length}
          subtitle="Held in DynamoDB locks"
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="Pending Check-in"
          value={upcomingReservations.length}
          subtitle="Within 15-min grace window"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Total Lifetime Bookings"
          value={bookings.length}
          subtitle="Academic year record"
          icon={Building}
          color="emerald"
        />
        <StatCard
          title="TIET ID Status"
          value={user?.role}
          subtitle={user?.email}
          icon={GraduationCap}
          color="purple"
        />
      </div>

      {/* Upcoming / Active Reservations */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your Campus Reservations</h2>
            <p className="text-xs text-slate-500">Atomic 30-minute lock slots at Thapar Institute</p>
          </div>
          <Link to="/my-bookings" className="text-xs font-semibold text-thapar-800 hover:text-thapar-950 flex items-center space-x-1">
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {activeReservations.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No active reservations"
              description="You do not have any active bookings at Thapar Institute right now."
              actionText="Book a Facility Now"
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
                    <span className="text-xs text-slate-400">Ref: {booking.id.slice(0, 12)}...</span>
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
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{actionLoading === booking.id ? 'Verifying...' : 'Check In'}</span>
                    </button>
                  )}

                  {booking.status === 'CHECKED_IN' && (
                    <button
                      onClick={() => handleCheckOut(booking.id)}
                      disabled={actionLoading === booking.id}
                      style={{ backgroundColor: '#8B1E2D' }}
                      className="px-4 py-2 rounded-xl bg-thapar-800 hover:bg-thapar-900 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-white" />
                      <span>{actionLoading === booking.id ? 'Checking Out...' : 'Check Out Now'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleCancel(booking.id)}
                    disabled={actionLoading === booking.id}
                    className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
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
