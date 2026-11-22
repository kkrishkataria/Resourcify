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
  Lock,
} from 'lucide-react';
import CheckInTimerButton from '../components/CheckInTimerButton.jsx';
import { getCheckInLockState } from '../utils/checkInHelper.js';

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

  const [dashboardDateFilter, setDashboardDateFilter] = useState('TODAY');
  const todayStr = new Date().toISOString().split('T')[0];

  const activeReservations = bookings.filter(
    (b) => b.status === 'CONFIRMED' || b.status === 'CHECKED_IN'
  );
  const todayReservations = activeReservations.filter((b) => b.date === todayStr);
  const upcomingReservations = bookings.filter((b) => b.status === 'CONFIRMED');

  const displayedReservations = dashboardDateFilter === 'TODAY' ? todayReservations : activeReservations;

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
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your Campus Reservations</h2>
            <p className="text-xs text-slate-500">Atomic 30-minute lock slots at Thapar Institute</p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Filter: Today's Bookings vs All Active */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setDashboardDateFilter('TODAY')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  dashboardDateFilter === 'TODAY'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Today Only ({todayReservations.length})
              </button>
              <button
                onClick={() => setDashboardDateFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  dashboardDateFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                All Upcoming ({activeReservations.length})
              </button>
            </div>

            <Link to="/my-bookings" className="text-xs font-semibold text-thapar-800 hover:text-thapar-950 flex items-center space-x-1 shrink-0">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {displayedReservations.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title={dashboardDateFilter === 'TODAY' ? "No bookings scheduled for today" : "No active reservations"}
              description={
                dashboardDateFilter === 'TODAY' && activeReservations.length > 0
                  ? `You have ${activeReservations.length} upcoming reservations on other dates. Switch to 'All Upcoming' to see them.`
                  : "You do not have any active bookings at Thapar Institute right now."
              }
              actionText={dashboardDateFilter === 'TODAY' && activeReservations.length > 0 ? "View All Upcoming" : "Book a Facility Now"}
              onAction={() => {
                if (dashboardDateFilter === 'TODAY' && activeReservations.length > 0) {
                  setDashboardDateFilter('ALL');
                } else {
                  navigate('/resources');
                }
              }}
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayedReservations.map((booking) => {
              const lockState = getCheckInLockState(booking);

              return (
                <div key={booking.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <StatusBadge status={booking.status} />
                      <span className="text-xs text-slate-400">Ref: {booking.id.slice(0, 12)}...</span>
                      {booking.status === 'CONFIRMED' && lockState.isLocked && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center space-x-1">
                          <Lock className="w-3 h-3 text-amber-600" />
                          <span>{lockState.badgeLabel}</span>
                        </span>
                      )}
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

                    {booking.status === 'CONFIRMED' && lockState.isLocked && (
                      <p className="text-[11px] text-amber-700 flex items-center space-x-1 pt-0.5">
                        <span>💡 {lockState.reason}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    <CheckInTimerButton
                      booking={booking}
                      onCheckIn={handleCheckIn}
                      onCheckOut={handleCheckOut}
                      actionLoading={actionLoading}
                    />

                    <button
                      onClick={() => handleCancel(booking.id)}
                      disabled={actionLoading === booking.id}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-slate-700 text-xs font-medium transition-colors cursor-pointer self-start mt-0.5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
