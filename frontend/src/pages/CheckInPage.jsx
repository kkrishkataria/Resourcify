import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { formatDate } from '../utils/formatters.js';
import {
  CheckCircle2,
  Clock,
  Calendar,
  Building,
  QrCode,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  LogOut,
} from 'lucide-react';

export default function CheckInPage() {
  const { user } = useAuth();
  const [confirmedBookings, setConfirmedBookings] = useState([]);
  const [checkedInBookings, setCheckedInBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState('');

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings');
      if (res.data?.success) {
        const all = res.data.data || [];
        setConfirmedBookings(all.filter((b) => b.status === 'CONFIRMED'));
        setCheckedInBookings(all.filter((b) => b.status === 'CHECKED_IN'));
      }
    } catch (err) {
      console.error('Failed to load check-in list:', err);
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
        setMessage('Check-in confirmed successfully! Your attendance is verified and your room slots are securely held.');
        fetchBookings();
      }
    } catch (err) {
      setMessage(`Check-in failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckOut = async (bookingId) => {
    if (!window.confirm('Check out of this facility now? Any remaining slots will be released immediately.')) {
      return;
    }
    setActionLoading(bookingId);
    setMessage('');
    try {
      const res = await api.post(`/bookings/${bookingId}/checkout`);
      if (res.data?.success) {
        setMessage('Checked out successfully! The facility slots have been freed for other students.');
        fetchBookings();
      }
    } catch (err) {
      setMessage(`Check-out failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Advance & On-Time Check-In Enabled</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Venue Check-In & Check-Out Hub
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Check in anytime in advance or up to 15m after session start. When finished, check out early to free slots for fellow Thapar members.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center justify-between">
          <span className="font-medium">{message}</span>
          <button onClick={() => setMessage('')} className="font-bold text-xs text-emerald-700 hover:text-emerald-900">
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <LoadingSpinner message="Scanning active reservations..." />
      ) : confirmedBookings.length === 0 && checkedInBookings.length === 0 ? (
        <EmptyState
          title="No pending check-ins or active sessions"
          description="You do not have any active bookings waiting for check-in or check-out."
          actionText="Browse Thapar Facilities"
          onAction={() => (window.location.href = '/resources')}
        />
      ) : (
        <div className="space-y-6">
          {/* Active Checked-In Sessions Ready for Check-Out */}
          {checkedInBookings.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h2 className="text-base font-bold text-slate-900">Active In-Session Venues (Ready for Check-Out)</h2>
              </div>
              {checkedInBookings.map((b) => (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl border-2 border-emerald-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        • Currently Occupying Venue
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">ID: {b.id.slice(0, 12)}</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{b.resourceName}</h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(b.date)}</span>
                      </span>
                      <span className="flex items-center space-x-1 font-semibold text-slate-800">
                        <Clock className="w-3.5 h-3.5 text-thapar-800" />
                        <span>{b.startTime} - {b.endTime}</span>
                      </span>
                      <span>• Checked in at {new Date(b.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCheckOut(b.id)}
                    disabled={actionLoading === b.id}
                    style={{ backgroundColor: '#8B1E2D' }}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-thapar-800 hover:bg-thapar-900 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-white" />
                    <span>{actionLoading === b.id ? 'Checking Out...' : 'Check Out & Release Venue'}</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Pending Check-In Reservations */}
          {confirmedBookings.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-bold text-slate-900">Upcoming Reservations Awaiting Check-In</h2>
              {confirmedBookings.map((b) => {
                const deadline = new Date(b.checkInDeadline);

                return (
                  <div
                    key={b.id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-slate-300 transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ✓ Open for Check-In
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">ID: {b.id.slice(0, 12)}</span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">{b.resourceName}</h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(b.date)}</span>
                        </span>
                        <span className="flex items-center space-x-1 font-semibold text-slate-800">
                          <Clock className="w-3.5 h-3.5 text-thapar-800" />
                          <span>{b.startTime} - {b.endTime}</span>
                        </span>
                        <span>• {b.purpose}</span>
                      </div>

                      <div className="flex items-center space-x-2 pt-1 text-xs">
                        <Clock className="w-4 h-4 text-emerald-600" />
                        <span className="text-slate-600">
                          Check-in allowed <strong>now</strong> or until deadline:{' '}
                          <strong className="text-slate-900 font-mono">
                            {deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="p-2 border border-slate-200 rounded-xl bg-slate-50 text-center hidden sm:block">
                        <QrCode className="w-10 h-10 text-slate-700 mx-auto" />
                        <span className="text-[9px] uppercase font-bold text-slate-400 block mt-0.5">TIET Code</span>
                      </div>

                      <button
                        onClick={() => handleCheckIn(b.id)}
                        disabled={actionLoading === b.id}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{actionLoading === b.id ? 'Verifying...' : 'Confirm Check-In Now'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
