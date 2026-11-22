import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { formatCategory, formatDate } from '../utils/formatters.js';
import {
  Calendar,
  Clock,
  Building,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  QrCode,
  LogOut,
  Lock,
} from 'lucide-react';
import CheckInTimerButton from '../components/CheckInTimerButton.jsx';
import { getCheckInLockState } from '../utils/checkInHelper.js';

export default function MyBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState('');
  const todayStr = new Date().toISOString().split('T')[0];

  const fetchBookings = async () => {
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
    fetchBookings();
  }, [user]);

  const handleCheckIn = async (bookingId) => {
    setActionLoading(bookingId);
    setMessage('');
    try {
      const res = await api.post(`/bookings/${bookingId}/checkin`);
      if (res.data?.success) {
        setMessage('Check-in confirmed successfully! Welcome to your reserved facility.');
        fetchBookings();
      }
    } catch (err) {
      setMessage(`Check-in failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckOut = async (bookingId) => {
    if (!window.confirm('Check out and complete your session now? Any remaining time slots will immediately be released for other students.')) {
      return;
    }
    setActionLoading(bookingId);
    setMessage('');
    try {
      const res = await api.post(`/bookings/${bookingId}/checkout`);
      if (res.data?.success) {
        setMessage('Checked out successfully! Your session is complete and remaining slots have been released.');
        fetchBookings();
      }
    } catch (err) {
      setMessage(`Check-out failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? This will immediately free all associated 30-min slot locks.')) {
      return;
    }
    setActionLoading(bookingId);
    setMessage('');
    try {
      const res = await api.delete(`/bookings/${bookingId}`);
      if (res.data?.success) {
        setMessage('Booking cancelled and slot locks released.');
        fetchBookings();
      }
    } catch (err) {
      setMessage(`Cancellation failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const statusMatch = filterStatus === 'ALL' || b.status === filterStatus;
    const dateMatch = dateFilter === 'ALL' || b.date === todayStr;
    return statusMatch && dateMatch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">My Reservations</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track confirmed bookings, perform check-in before deadline, or cancel to free slots.
          </p>
        </div>
        <Link
          to="/resources"
          className="px-4 py-2 rounded-xl bg-campus-800 hover:bg-campus-900 text-white font-semibold text-xs shadow-xs transition-colors self-start"
        >
          + New Booking
        </Link>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-sm flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-blue-600 font-bold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Status & Date Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-2 overflow-x-auto text-xs font-semibold">
          {['ALL', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                filterStatus === status
                  ? 'bg-campus-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {status.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Date Filter Segmented Switch */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setDateFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              dateFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All Dates
          </button>
          <button
            onClick={() => setDateFilter('TODAY')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              dateFilter === 'TODAY'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Today's Bookings
          </button>
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <LoadingSpinner message="Retrieving your bookings..." />
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          title="No reservations found"
          description={`You do not have any reservations under '${filterStatus}'.`}
          actionText="Browse Available Facilities"
          onAction={() => (window.location.href = '/resources')}
        />
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => {
            const lockState = getCheckInLockState(b);

            return (
              <div
                key={b.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={b.status} />
                    <span className="text-[11px] text-slate-400 font-mono">Ref: {b.id.slice(0, 14)}</span>
                    {b.status === 'CONFIRMED' && lockState.isLocked && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center space-x-1">
                        <Lock className="w-3 h-3 text-amber-600" />
                        <span>{lockState.badgeLabel}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{b.resourceName}</h3>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-600">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDate(b.date)}</span>
                    </span>
                    <span className="flex items-center space-x-1 font-semibold text-slate-800">
                      <Clock className="w-3.5 h-3.5 text-campus-600" />
                      <span>{b.startTime} - {b.endTime}</span>
                    </span>
                    <span>• {b.attendeesCount || 1} Attendees</span>
                    <span>• Purpose: {b.purpose}</span>
                  </div>

                  {/* Slots and deadline note */}
                  <div className="text-[11px] text-slate-400 flex items-center space-x-3 pt-0.5">
                    <span>Occupies {b.slotKeys?.length || 1} atomic slots</span>
                    {b.status === 'CONFIRMED' && (
                      <span className="text-amber-600 font-medium">
                        {lockState.isLocked ? lockState.reason : `Check-in Deadline: ${new Date(b.checkInDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3 shrink-0">
                  <CheckInTimerButton
                    booking={b}
                    onCheckIn={handleCheckIn}
                    onCheckOut={handleCheckOut}
                    actionLoading={actionLoading}
                  />

                  {b.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleCancel(b.id)}
                      disabled={actionLoading === b.id}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-slate-700 text-xs font-medium transition-colors cursor-pointer self-start mt-0.5"
                    >
                      Cancel
                    </button>
                  )}

                  {b.status === 'COMPLETED' && (
                    <div className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Completed & Checked Out</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
